import {Component, OnInit, TemplateRef} from '@angular/core';
import {IProject} from '../../models';
import {AngularFirestore} from '@angular/fire/firestore';
import {debounceTime, distinctUntilChanged, map} from 'rxjs/operators';
import {AuthService} from '../../services/auth.service';
import {Router} from '@angular/router';
import {BsModalService, BsModalRef} from 'ngx-bootstrap/modal';
import {combineLatest, of, Subject} from "rxjs";
import {AngularFireStorage, AngularFireStorageReference} from "@angular/fire/storage";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {CountryISO} from 'ngx-intl-tel-input';
import firebase from "firebase";

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.less']
})
export class AdminComponent implements OnInit {
  modalRef?: BsModalRef;
  isLoading = true;
  projects: IProject[] = [];
  // @ts-ignore
  project: IProject | null = JSON.parse(localStorage.getItem('project'));
  referral = '';
  images = [];

  CountryISO = CountryISO;
  form: FormGroup | undefined;
  searchTerm: string = '';
  modelChanged: Subject<string> = new Subject<string>();

  constructor(
    private modalService: BsModalService,
    private firestore: AngularFirestore,
    private fireStorage: AngularFireStorage,
    private auth: AuthService,
    private router: Router
  ) {
    this.modelChanged
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(search => {
        this.searchTerm = search;
        this.projects.forEach(i => i.isHidden = true)
        this.projects
          .filter(i => i.name?.toLowerCase().includes(this.searchTerm.toLowerCase()) || i.phone?.toLowerCase().includes(this.searchTerm.toLowerCase()))
          .forEach(i => i.isHidden = false);
      });
  }

  ngOnInit(): void {
    setTimeout(() => {
      // @ts-ignore
      this.referral = JSON.parse(localStorage.getItem('userData')).referral;
      this.onGetProjects();
      this.createForm();
    }, 1000)
  }

  private createForm() {
    this.form = new FormGroup({
      name: new FormControl(''),
      phone: new FormControl(null, [Validators.required]),
      email: new FormControl(''),
      manager: new FormControl(localStorage.getItem('manager')),
      photo: new FormControl([]),
    })
  }

  get isNoResults():boolean {
    return !this.projects.find(i => !i.isHidden);
  }

  onGetProjects() {
    // @ts-ignore
    const USER = JSON.parse(localStorage.getItem('userData'));
    const P = localStorage.getItem('projects');

    if(P) {
      this.projects = JSON.parse(P);
      this.isLoading = false;
    } else {
      this.firestore
        .collection('projects', ref => ref.orderBy('postedAt'))
        .snapshotChanges()
        .pipe(map(u => u.map(a => a.payload.doc.data() as IProject)))
        .subscribe((r: IProject[]) => {
          this.projects = r.reverse();
          if(!USER?.isAdmin) {
            this.projects.filter(p => p.manager !== USER?.referral).forEach(i => i.isHidden = true);
          }
          localStorage.setItem('projects', JSON.stringify(this.projects));
          this.isLoading = false;
        });
    }
  }

  onGetDate(timestamp: any) {
    return new Date(timestamp.seconds*1000);
  }

  onSelectProject(project: IProject) {
    localStorage.removeItem('project');
    localStorage.setItem('project', JSON.stringify(project));
    this.project = project;
  }

  onMeasureImage(photo: string) {
    this.isLoading = true;
    if(photo.includes('data:image/')) {
      localStorage.setItem('photo', photo);
      this.isLoading = false;
      this.router.navigateByUrl('/measurement').then();
    } else {
      this.toDataURL(photo, (dataUrl: any) => {
        localStorage.setItem('photo', dataUrl);
        this.isLoading = false;
        this.router.navigateByUrl('/measurement').then();
      })
    }
  }

  toDataURL(url: any, callback: any) {
    let canvas = document.createElement('canvas');
    let img = document.createElement('img');
    img.setAttribute('crossorigin', 'anonymous');
    img.src = 'https://satoshi-cors.herokuapp.com/' + url;

    img.onload = () => {
      canvas.height = img.height / (img.width/1200);
      canvas.width = 1200;
      let context = canvas.getContext('2d');
      context?.drawImage(img, 0, 0, canvas.width, canvas.height);
      let dataURL = canvas.toDataURL('image/png');
      // @ts-ignore
      canvas = null;
      callback(dataURL);
    };
  }

  onReload() {
    localStorage.removeItem('projects');
    window.location.reload();
  }

  onLogOut() {
    this.auth.logout().then();
  }

  onAddCustomer(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template);
  }

  handleFileInput(event: any, id: string) {
    this.isLoading = true;
    let itemsProcessed = 0;
    Object.keys(event.target.files).forEach((i: any) => {
      const reader = new FileReader();
      reader.readAsDataURL(event.target.files[i]);
      reader.onload = () => {
        // @ts-ignore
        this.images.push(reader.result)
        itemsProcessed++;
        if(itemsProcessed === Object.keys(event.target.files).length) {
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
                    img.forEach(i => this.project.photos.push(i));
                    this.firestore.doc(`projects/${id}`)
                      .update({
                        photos: this.project?.photos
                      })
                      .then(() => {
                        // @ts-ignore
                        let projects = JSON.parse(localStorage.getItem('projects'));
                        projects.find((z: any) => z.id === id).photos.length = 0;
                        this.project?.photos?.forEach(i => {
                          projects.find((z: any) => z.id === id).photos.push(i)
                        });
                        localStorage.setItem('projects', JSON.stringify(projects))
                        localStorage.setItem('project', JSON.stringify(projects.find((z: any) => z.id === id)));
                        this.images.length = 0;
                        this.isLoading = false;
                      });
                  });
              });
          });
        }
      };
    });
  }

  handleFileInput2(event: any) {
    this.modalRef?.hide();
    this.isLoading = true;
    let itemsProcessed = 0;

    const data: IProject = {};
    data.name = this.form?.value.name;
    data.phone = this.form?.value.phone.number;
    data.email = this.form?.value.email;
    data.manager = this.form?.value.manager;
    data.photos = [];
    data.postedAt = firebase.firestore.FieldValue.serverTimestamp();


    Object.keys(event.target.files).forEach((i: any) => {
      const reader = new FileReader();
      reader.readAsDataURL(event.target.files[i]);
      reader.onload = () => {
        // @ts-ignore
        this.images.push(reader.result)
        itemsProcessed++;
        if(itemsProcessed === Object.keys(event.target.files).length) {
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
                        this.firestore.doc(`projects/${res.id}`)
                          .update(data)
                          .then(() => {
                            this.isLoading = false;
                            this.form?.reset();
                            this.onReload();
                          });
                      });
                  });
              });
          });
        }
      };
    });
  }

  onSearch(e: any) {
    this.modelChanged.next(e);
  }
}
