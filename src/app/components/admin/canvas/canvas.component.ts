import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {AuthService} from "../../../services/auth.service";
declare let HotZone: any;
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.less']
})
export class CanvasComponent implements OnInit {
  @ViewChild('projectImage') projectImage: ElementRef | undefined;

  config = {
    lineWidth: 1,
    lineGrabZone: 20,
    lineColor: '#ff0000',
    overlayColor: '',
    selectedColor: null,
    grayscale: false,
  };

  hotZone = new HotZone();

  // @ts-ignore
  photo: string | undefined = localStorage.getItem('photo');

  creditCard = 297;
  millimetersInPixel: number = 0;

  isCalibrated = false;
  standardSelected = false;

  rotatedPhoto = '';

  constructor(
    private router: Router,
    private auth: AuthService,
    private domSanitizer: DomSanitizer
  ) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
  }

  ngOnInit(): void {
    this.hotZone.defaults = this.config;
  }

  startMeasuring() {
    setTimeout(() => {
      this.hotZone.useOnImage(this.projectImage?.nativeElement);
    }, 300);
    this.isCalibrated = true;
  }

  onSelectStandard() {
    const selectedZone = this.hotZone.getSelection();
    if(selectedZone) {
      console.log(selectedZone.width, selectedZone.height)
      this.millimetersInPixel = this.creditCard / (selectedZone.width > selectedZone.height ? selectedZone.width : selectedZone.height);
      this.hotZone.clear();
      this.standardSelected = true;
    }
  }

  onGetSize(): string | void {
    if(this.hotZone?.getSelection()?.width) {
      console.log(this.hotZone.getSelection().width, this.hotZone.getSelection().height)
      const width = (this.hotZone.getSelection().width * this.millimetersInPixel).toFixed(1);
      const height = (this.hotZone.getSelection().height * this.millimetersInPixel).toFixed(1);
      return `${width}mm x ${height}mm`;
    } else {
      return 'Select the area you want to know the dimensions...'
    }
  }

  // Controls
  rotate(direction: 'left' | 'right') {
    const img = this.rotatedPhoto ? this.rotatedPhoto : this.photo;
    this.rotatedPhoto = this.rotateBase64Image90deg(img, direction !== 'left')
  }

  rotateBase64Image90deg(base64Image: string | undefined, isClockwise: boolean) {
    let offScreenCanvas = document.createElement('canvas');
    let offScreenCanvasCtx = offScreenCanvas.getContext('2d');
    let img: any = new Image();
    img.src = base64Image;
    offScreenCanvas.height = img.width;
    offScreenCanvas.width = img.height;
    if (isClockwise) {
      offScreenCanvasCtx?.rotate(90 * Math.PI / 180);
      offScreenCanvasCtx?.translate(0, -offScreenCanvas.width);
    } else {
      offScreenCanvasCtx?.rotate(-90 * Math.PI / 180);
      offScreenCanvasCtx?.translate(-offScreenCanvas.height, 0);
    }
    offScreenCanvasCtx?.drawImage(img, 0, 0);
    return offScreenCanvas.toDataURL('image/jpeg', 100);
  }

  zoom(direction: 'in' | 'out') {
    const img = this.rotatedPhoto ? this.rotatedPhoto : this.photo;
    this.rotatedPhoto = this.zoomBase64(img, direction)
  }

  zoomBase64(base64Image: string | undefined, direction: 'in' | 'out') {
    let offScreenCanvas = document.createElement('canvas');
    let offScreenCanvasCtx = offScreenCanvas.getContext('2d');
    let img: any = new Image();
    img.src = base64Image;

    if(direction === 'in') {
      offScreenCanvas.height = img.height / 100 * 110;
      offScreenCanvas.width = img.width / 100 * 110;
      offScreenCanvasCtx?.drawImage(img, 0, 0, img.width / 100 * 110, img.height / 100 * 110);
    } else {
      offScreenCanvas.height = img.height / 100 * 90;
      offScreenCanvas.width = img.width / 100 * 90;
      offScreenCanvasCtx?.drawImage(img, 0, 0, img.width / 100 * 90, img.height / 100 * 90);
    }

    return offScreenCanvas.toDataURL('image/jpeg', 100);
  }

  onLogOut() {
    this.auth.logout().then();
  }

}
