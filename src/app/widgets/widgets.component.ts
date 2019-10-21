import { Component, OnInit } from '@angular/core';
import { Widget } from '../sisense/widget';
import { WIDGETS } from '../sisense/mock-widgets';
import { WidgetService } from '../sisense/widget.service';

@Component({
  selector: 'app-widgets',
  templateUrl: './widgets.component.html',
  styleUrls: ['./widgets.component.scss']
})
export class WidgetsComponent implements OnInit {

  widgets: Widget[] = [];
  selectedWidget: Widget;

  getWidgets(): void {
  	this.widgetService.getWidgets()
  		.subscribe(widgets => {

        let newWidgets = (this.widgets.length !== widgets.length);
        if (newWidgets){
          this.widgets = widgets;
        }
      });
  } 

  onSelect(widget: Widget): void {
    this.selectedWidget = widget;
  }

  constructor(private widgetService: WidgetService) { }

  ngOnInit() {
  	
    //  Continuously check for new widgets every 200ms... must be a better way
    let fetchWidgets = this.getWidgets.bind(this);
    setInterval(function(){
      fetchWidgets();
    }, 200);
    //this.getWidgets();
  }

}
