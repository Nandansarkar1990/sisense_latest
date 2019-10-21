import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, pipe, defer, of, from } from 'rxjs';
import { Config } from './config';
import { Widget } from './widget';
import { LogService } from '../logs/log.service';
import { WIDGETS } from './mock-widgets';
import { LoginService } from '../services/login.service'

@Injectable({
  providedIn: 'root'
})

export class WidgetService {

  //  Initialize variables
  isReady: boolean = false;
  //server: string = 'http://takashi.sisense.com';
  server: string = 'http://localhost:8081';
  tagId: string = 'sisenseScript';
  dashboardPrefix: string = '_gallery';
  skippedTypes: string[] = ['richtexteditor'];
  waitTime: number = 100;

  //  Default widget sizes
  widgetTypeShort: string[] = ['indicator'];
  widgetTypeWide: string[] = ['chart/line', 'chart/area'];

  //  Create placeholders for any Sisense objects
  sisenseApp: any;
  dashboard: any;
  widgets: Widget[] = [];
  widgetsObserver: Observable<string>;

  //  Variables to track when the gallery is complete
  dashboardsAvailable: number = 0;
  dashboardsProcessed: number = 0;
  widgetGalleryComplete: boolean = false;

  /**********************************************************************/
  /*  Sisense functions to load sisense.js and fetch relevant widgets   */
  /**********************************************************************/

  //  Step 1: Function to load the sisense.js library
  addSisenseJS(): void {

    //  Define the script tag to add
    let tag = document.createElement('script');
    tag.src = this.server + '/js/sisense.js';
    tag.id = this.tagId;
    tag.type = 'text/javascript';
    tag.charset = 'utf-8';

    //  Mark the starting time
    let startTime = new Date().getTime();

    //  Add event handler for when the script loads
    let connectFunc = this.connect.bind(this);
    let logger = this.logService;
    tag.onload = function () {

      //  Figure out how long it took to load
      let endTime = new Date().getTime();
      let duration = Math.round((endTime - startTime) / 1000);

      //  Log the output
      logger.add(`Sisensejs: Loaded in ${duration} seconds`);
      connectFunc();
    }

    //  Add the tag to the web page
    document.getElementsByTagName('body')[0].appendChild(tag);
    this.logService.add('Sisensejs: Adding Sisense.js script tag');
  }

  //  Step 2: Connect to sisense, and save a reference to the sisense application
  connect(): void {

    //  Apply the fix for angular rewrite issue
    this.fixRewrite();

    //  start a new timer
    let startTime = new Date().getTime();

    //  Bind this object to the sisense connect function, and run
    let ws = this;
    Sisense.connect(this.server).then(function (app) {

      //  Figure out how long it took to connect
      let endTime = new Date().getTime();
      let duration = Math.round((endTime - startTime) / 1000);
      ws.logService.add(`Sisensejs: Connected to your Sisense server in ${duration} seconds`);

      //  Save a reference to the sisenseApp
      ws.sisenseApp = app;

      //  Create a dashboard to store any potential widgets
      ws.dashboard = new Dashboard();
      ws.sisenseApp.dashboards.add(ws.dashboard);

      //  Mark the isReady flag = true
      ws.isReady = true;

      //  Set a new timer to see how long the widget library takes
      let wlStartTime = new Date().getTime();

      //  Get list of widgets from the gallery dashboards
      let dashboardsUrl = ws.server + '/api/v1/dashboards?fields=oid%2Ctitle&expand=widgets(oid%2Ctitle)';
      ws.sisenseApp.$$http.get(dashboardsUrl).then(function (response) {

        //  Clear the array of widgets
        ws.widgets = [];

        //  Filter the list of dashboards, based on the dashboard's title
        let myDashboards = response.data.filter(dashboard => {
          return dashboard.title.indexOf(ws.dashboardPrefix) == 0;
        })

        //  Set the counter for number of dashboards available
        ws.dashboardsAvailable = myDashboards.length;

        //  Loop through each dashboard returns
        myDashboards.forEach(dashboard => {

          //  Get the list of widgets for this dashboard
          let widgetsUrl = `/api/v1/dashboards/5da040b2da2ddb1cb898d754/widgets?fields=oid%2Ctitle%2Ctype`;
          ws.sisenseApp.$$http.get(widgetsUrl).then(function (response) {

            //  Filter out text widgets and widgets with no title
            let validWidgets = response.data.filter(function (widget) {
              let isValid = (widget.title.length > 0) && (ws.skippedTypes.indexOf(widget.type) < 0);
              return isValid;
            })

            //  Loop through each widget on this dashboard
            validWidgets.forEach(function (widget, index) {

              //  Figure out what default size to use
              let defaultSize = ws.getDefaultSize(widget.type, widget.subtype);

              //  Instantiate a widget object (by default save the first 4 to the dashboard)
              let newWidget = {
                id: widget.oid,
                title: widget.title,
                type: widget.type,
                size: defaultSize,
                save: index < 4,
              }

              //  Save to the list of available widgets
              ws.widgets.push(newWidget);
              ws.logService.add(`Sisensejs: Adding widget ${widget.oid} to the widget gallery`);
            })

            //  Resort the widgets, based on their type
            let sortFunction = ws.sortWidgets.bind(ws);
            ws.widgets.sort(sortFunction);

            //  Update the counter for the widget gallery
            ws.dashboardsProcessed += 1;

            //  Check to see if all widgets have been fetched from the Sisense server
            if (ws.dashboardsProcessed === ws.dashboardsAvailable) {

              ws.widgetGalleryComplete = true;

              //  Loop through the widgets one last time to set the 
              let wlEndTime = new Date().getTime();
              let wlDuration = Math.round((wlEndTime - wlStartTime) / 1000);
              console.log(`Widget Gallery Complete`);
              ws.logService.add(`Sisensejs: All widgets fetched in ${wlDuration} seconds`);
            }
          })
        })
      })
    })
  }

  //  Fix for angular rewrite module
  fixRewrite(): void {

    let urlChangeCallback;

    //  The (<any>window) part just lets us reference window.prism (otherwise typescript throws a messaging saying undefined)
    (<any>window).prism.sisenseAngular
      .module('standalone')
      .config(['$provide', ($provide) => {
        $provide.decorator('$browser', ['$delegate', ($delegate) => {
          const { onUrlChange } = $delegate;

          $delegate.url = () => window.location.href;
          $delegate.onUrlChange = () => onUrlChange((newUrl, newState) => {
            if (typeof urlChangeCallback === 'function') {
              urlChangeCallback(newUrl, newState);
            }
          });

          return $delegate;
        }]);
      }])
      .run(['$rootScope', '$location', '$browser', ($rootScope, $location, $browser) => {
        $rootScope.$$watchers.some((watcher, index, arr) => {
          const exp = watcher.exp.toString();

          if (exp.indexOf('$locationChangeStart') !== -1) {
            arr.splice(index, 1);
            return true;
          }
        });

        function setBrowserUrlWithFallback(url, replace, state) {
          const oldUrl = $location.url();
          const oldState = $location.$$state;

          try {
            $browser.url(url, replace, state);
            $location.$$state = $browser.state();
          } catch (e) {
            $location.url(oldUrl);
            $location.$$state = oldState;

            throw e;
          }
        }

        function afterLocationChange(oldUrl, oldState) {
          $rootScope.$broadcast(
            '$locationChangeSuccess',
            $location.absUrl(),
            oldUrl,
            $location.$$state,
            oldState
          );
        }

        urlChangeCallback = (newUrl, newState) => {
          $rootScope.$evalAsync(() => {
            const oldUrl = $location.absUrl();
            const oldState = $location.$$state;

            $location.$$parse(newUrl);
            $location.$$state = newState;

            const defaultPrevented = $rootScope.$broadcast(
              '$locationChangeStart', newUrl, oldUrl, newState, oldState
            ).defaultPrevented;

            if ($location.absUrl() !== newUrl) {
              return;
            }

            if (defaultPrevented) {
              $location.$$parse(oldUrl);
              $location.$$state = oldState;
              setBrowserUrlWithFallback(oldUrl, false, oldState);
            } else {
              afterLocationChange(oldUrl, oldState);
            }
          });

          if (!$rootScope.$$phase) {
            $rootScope.$digest();
          }
        };
      }]);
  }

  /**********************************************************************/
  /*  Sisense functions to load init/render/destroy widgets             */
  /**********************************************************************/

  //  Function to sort the widgets, based on type
  sortWidgets(a: Widget, b: Widget) {

    //  Function to determine the sorting score based on widget type
    function getWidgetTypeScore(ws: any, type: string): number {
      //  Check the widget types
      if (ws.widgetTypeShort.indexOf(type) >= 0) {
        //  Short  widget
        return 1;
      } else if (ws.widgetTypeWide.indexOf(type) >= 0) {
        //  Wide widget
        return 3;
      } else {
        //  All others
        return 2;
      }
    }

    //  Calculate scores for both objects
    let aScore = getWidgetTypeScore(this, a.type);
    let bScore = getWidgetTypeScore(this, b.type);

    //  Do the comparison
    if (aScore < bScore)
      return -1;
    if (aScore > bScore)
      return 1;
    return 0;
  }

  //  Function to determine the default size of a widget
  getDefaultSize(type: string, subtype: string): string {

    //  Check the widget types
    if (this.widgetTypeShort.indexOf(type) >= 0) {

      //  Short  widget
      return 'short';
    } else if (this.widgetTypeWide.indexOf(type) >= 0) {

      //  Wide widget
      return 'wide';
    } else {

      //  All others
      return 'standard';
    }
  }

  //  Public function that renders a widget in a div container
  loadWidget(widgetId: string, divId: string): void {

    //  Check to see if this widget exists already
    let existingWidget = this.dashboard.$$widgets.$$widgets.find(widget => widget.id === widgetId);
    //let existingWidget = false

    //  Does this widget already exist?
    if (existingWidget) {

      //  Wait for this code block to run
      setTimeout(() => {

        //  Make sure the container of the widget is set
        existingWidget.$$container = null;
        existingWidget.$$initialized = true;
        existingWidget.container = document.getElementById(divId);

        //  Yes, just refresh the widget
        existingWidget.refresh();
      }, 0)

    } else {

      //  No, load the widget into the dashboard model
      this.dashboard.widgets.load(widgetId).then(function (widget) {

        //  Set the container of the widget
        widget.container = document.getElementById(divId);

        //  TODO: ensure the data source for this widget is included in the dashboard object model

        //  Refresh the widget
        widget.refresh();
      })
    }
  }

  removeWidget(widgetId: string): void {

    //  Loop through each widget on the dashboard
    for (var i = this.dashboard.$$widgets.$$widgets.length - 1; i >= 0; i--) {

      // Is this the right widget?
      let currentWidget = this.dashboard.$$widgets.$$widgets[i];
      if (currentWidget.id === widgetId) {

        //  Remove from the list of widgets in the dashboard
        currentWidget.destroy();
      }
    }
  }

  /**********************************************************************/
  /*  Accessor functions, that provide the widgets to the angular app   */
  /**********************************************************************/


  //  Public function that returns the list of all widgets
  getWidgets(): Observable<Widget[]> {
    //this.logService.add(`WidgetService: fetched ${this.widgets.length} widget(s)`);
    return of(this.widgets);
  }

  //  Public function that returns a single widget, from an ID
  getWidget(id: string): Observable<Widget> {
    //this.logService.add(`WidgetService: fetched widgetId: ${id}`);
    return of(this.widgets.find(widget => widget.id === id));
  }

  //  Code to run when the application is loaded
  constructor(private http: HttpClient, private logService: LogService, private loginService: LoginService) {
    let token = ''
    // let header = new HttpHeaders();
    // header.append('username', 'nandansarkar@yopmail.com'),
    // header.append('password', '9774159349@Na')
    // this.http.post('http://localhost:8081/api/v1/authentication/login', {username: 'nandansarkar@yopmail.com', password: '9774159349@Na'}).subscribe((data) => {
    //   console.log(data)
    //   token = (data as any).access_token;
    // })

    // if(token) {
    //   console.log('token' + token);
    // }
    //  Save a reference to this
    let ws = this;


    //  When this service loads, get the sisense settings
    this.http.get('assets/js/sisenseSettings.json')
      .subscribe((data: Config) => {

        //  Set the properties
        ws.server = data.server;
        ws.tagId = data.scriptTagId;
        ws.dashboardPrefix = data.dashboardGalleryPrefix;
        ws.skippedTypes = data.skippedWidgetTypes;

        //  Make sure the sisense.js library is loaded
        ws.addSisenseJS();
      })
  }
}
