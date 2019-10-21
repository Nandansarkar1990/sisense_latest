import { Component, OnInit } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { LogService } from './log.service';

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss']
})
export class LogsComponent implements OnInit {

  closeResult: string;

  constructor(public logService: LogService, private modalService: NgbModal) { }

  open(content) {

    //  Define the options to pass to the modal window
    let options = {
      ariaLabelledBy: 'modal-basic-title',
      windowClass: 'custom-modal-class'
    }

    //  Open the modal, 
    this.modalService.open(content, options);
  }

  ngOnInit() {
  }

}
