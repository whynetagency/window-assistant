import {Component, HostListener, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {WebcamImage, WebcamInitError} from 'ngx-webcam';
import {CountryISO} from 'ngx-intl-tel-input';
import {Observable, Subject} from 'rxjs';
import {EStep, IProject} from '../../models';
import {AngularFirestore} from '@angular/fire/firestore';
import firebase from 'firebase';
import {combineLatest, of} from 'rxjs';
import {AngularFireStorage, AngularFireStorageReference} from "@angular/fire/storage";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less']
})
export class HomeComponent implements OnInit {

  @HostListener('window:resize', ['$event'])

  isLoading = false;

  activeStep: EStep = EStep.First;
  steps = EStep;
  CountryISO = CountryISO;
  trigger: Subject<void> = new Subject<void>();
  webcamImage: WebcamImage | null = null;
  errors: WebcamInitError[] = [];

  screenHeight = 0;
  screenWidth = 0;

  form: FormGroup | undefined;

  denomination = 'One dollar';

  images = [];

  constructor(
    private firestore: AngularFirestore,
    private fireStorage: AngularFireStorage
  ) {
    this.screenHeight = window.innerHeight;
    this.screenWidth = window.innerWidth;
    this.createForm();
  }

  handleFileInput(event: any) {
    Object.keys(event.target.files).forEach((i: any) => {
      const reader = new FileReader();
      reader.readAsDataURL(event.target.files[i]);
      reader.onload = () => {
        // @ts-ignore
        this.images.push(reader.result)
      };
    });
    this.onChangeStep(EStep.Fourth);
  }

  public ngOnInit(): void {}

  public onChangeStep(step: EStep): void {
    this.activeStep = step;
  }

  public triggerSnapshot(): void {
    this.trigger.next();
  }

  public removePhoto(): void {
    this.webcamImage = null;
  }

  public handleImage(webcamImage: WebcamImage): void {
    this.webcamImage = webcamImage;
  }

  public handleInitError(error: WebcamInitError): void {
    this.errors.push(error);
  }

  public get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }

  public onSelectDenomination(denomination: string): void {
    this.denomination = denomination;
  }

  private createForm() {
    this.form = new FormGroup({
      name: new FormControl(''),
      phone: new FormControl(null, [Validators.required]),
      email: new FormControl(''),
      manager: new FormControl(localStorage.getItem('manager')),
      photo: new FormControl(this.webcamImage?.imageAsDataUrl),
    })
  }

  public onSubmit() {
    // @ts-ignore
    this.images.push(this.webcamImage?.imageAsDataUrl);
    this.isLoading = true;
    const data: IProject = {};
    data.coinDenominations = this.denomination;
    data.name = this.form?.value.name;
    data.phone = this.form?.value.phone.number;
    data.email = this.form?.value.email;
    data.manager = this.form?.value.manager;
    // @ts-ignore
    // data.photo = this.webcamImage?.imageAsDataUrl;
    data.photos = [];
    data.postedAt = firebase.firestore.FieldValue.serverTimestamp();


    combineLatest(this.images.map(img => {
      const newName = `${new Date().getTime()}.jpeg`;
      const storageRef: AngularFireStorageReference = this.fireStorage.ref(`/files/projects/${newName}`);
      return of({
        task: storageRef.putString(img, 'data_url', { contentType: 'image/jpeg' }),
        ref: storageRef
      });
    })).subscribe( (resp: any) => {
      Promise.all(resp.map((i: any) => i.task))
        .then(() => {
          combineLatest(resp.map((i: any) => i.ref.getDownloadURL()))
            .subscribe(img => {
              // @ts-ignore
              img.forEach(i => data.photos.push(i));
              this.firestore.collection('projects')
                .add(data)
                .then(res => {
                  data.id = res.id;
                  this.onChangeStep(EStep.Fifth)
                  this.firestore.doc(`projects/${res.id}`)
                    .update(data)
                    .then(() => {
                      this.isLoading = false;
                      this.onChangeStep(EStep.Fifth)
                    });
                });
            });
        });
    });
  }
}
