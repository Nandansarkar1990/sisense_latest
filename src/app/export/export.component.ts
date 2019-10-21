import { Component, OnInit } from '@angular/core';
import * as PptxGenJS from 'pptxgenjs-angular';
import domtoimage from 'dom-to-image';

@Component({
  selector: 'app-export',
  templateUrl: './export.component.html',
  styleUrls: ['./export.component.css']
})
export class ExportComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  exportFileAsPpt() {
    console.log("export triggerd");
    let pptx = new PptxGenJS();
    let slide = pptx.addNewSlide();
    let content = document.getElementsByClassName('container');
    domtoimage.toPng(content[0])
      .then(function (dataUrl) {
        var img = new Image();
        img.src = dataUrl;
        slide.addImage({ data: img.src, x: 1, y: 1, w: 8.0, h: 4.0 });
        pptx.save();
      })
  }

}
