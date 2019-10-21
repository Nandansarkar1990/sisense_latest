import { Component, OnInit, OnChanges, OnDestroy, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import * as $ from 'jquery';
import { Widget } from '../sisense/widget';
import { WidgetService } from '../sisense/widget.service';

@Component({
  selector: 'app-widget-details',
  templateUrl: './widget-details.component.html',
  styleUrls: ['./widget-details.component.scss']
})
export class WidgetDetailsComponent implements OnInit, OnChanges, OnDestroy {

  @Input() widget: Widget;
  lastWidget: Widget;

  getContainerId() : string {
    return this.widget.id + '-container';
  }

  clearContainer(): void {

    //  Only run if a widget has been loaded
    if (this.widget && !this.widget.save){

      //  Find the container for this widget
      let container = document.getElementById(this.getContainerId());

      //  Clear it
      container.innerHTML = '';
    }
  }

  getWidget(): void {

    //  Only run if there was a widget selected
    if (this.widget) {

      //  Clear the container to remove any old widgets
      if (this.lastWidget) {
        this.widgetService.removeWidget(this.lastWidget.id);
        $('.sisense-widget-container').empty();
    	}
      //  Get the selected widget
    	this.widgetService.getWidget(this.widget.id)
    		.subscribe(widget => {

          //  Save a reference to the last widget
          this.lastWidget = this.widget;

          //  Set the widget object
          this.widget = widget;

          //  Render the new widget
          this.widgetService.loadWidget(widget.id, this.getContainerId())
        });
    }
  }

  removeWidget(): void {
    if (this.widget){
      this.widgetService.removeWidget(this.widget.id);
    }
  }

  constructor(
  	private route: ActivatedRoute,
  	private location: Location,
  	private widgetService: WidgetService
  ) { }

  ngOnInit() {
  	
  }

  ngOnChanges() {
    this.getWidget();
  }

  ngOnDestroy() {
    this.removeWidget();
  }

}
