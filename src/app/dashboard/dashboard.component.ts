import { Component, OnInit, OnChanges, OnDestroy } from '@angular/core';
import { NgbPanelChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import { Widget } from '../sisense/widget';
import { WidgetService } from '../sisense/widget.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnChanges, OnDestroy {

  widgets: Widget[] = [];

  getContainerId(widgetId: string) : string {
    return widgetId + '-container';
  }

  getWidgets(): void {
  	this.widgetService.getWidgets()
  		.subscribe(widgets => {
        //  Get the list of widgets
        let newWidgets = widgets.filter(widget => { return widget.save; });
        if (newWidgets.length !== this.widgets.length) {

          //  New list of widgets, render them
          this.widgets = newWidgets;
          this.renderWidgets();  
        }
      });
  }

  renderWidgets(): void {
    //  Loop through each widget, and load it
    for (let i=0; i<this.widgets.length; i++){
      let widgetId = this.widgets[i].id;
      this.widgetService.loadWidget(widgetId, this.getContainerId(widgetId));
    }
  }

  constructor(private widgetService:WidgetService) { }

  ngOnInit() {

    //  Continuously check for new widgets every 200ms... must be a better way
    let fetchWidgets = this.getWidgets.bind(this);
    setInterval(function(){
      fetchWidgets();
    }, 200);
  	//this.getWidgets();
  }

  ngOnChanges() {
    
  }

  ngOnDestroy() { }

}
