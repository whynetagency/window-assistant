import {Injectable} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore} from '@angular/fire/firestore';
import {Router} from '@angular/router';
import {IUser} from '../models';
import {tap} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  userData: any;

  constructor(
    public afs: AngularFirestore,
    public afAuth: AngularFireAuth,
    public router: Router,
  ) {
    this.afAuth.authState.subscribe((user: any) => {
      if (user) {
        this.userData = {
          email: user.email,
          emailVerified: user.emailVerified,
          uid: user.uid
        };
        this.afs.doc(`users/${user.uid}`).valueChanges().pipe(
          tap((r: any) => {
            localStorage.setItem('userData', JSON.stringify(r));
          })
        ).subscribe();
        localStorage.setItem('user', JSON.stringify(this.userData));
      } else {
        localStorage.clear();
      }
    });
  }

  login(email: string, password: string) {
    return this.afAuth.signInWithEmailAndPassword(email, password)
      .then((result: any) => {
        this.router.navigate(['admin']).then();
        this.setUserData(result.user).then();
      }).catch((error: any) => {
        window.alert(error.message);
      });
  }

  get isLoggedIn(): boolean {
    return localStorage.getItem('user') !== null;
  }

  public setUserData(user: any) {
    const userData: IUser = {
      email: user.email,
      emailVerified: user.emailVerified,
      uid: user.uid
    };
    localStorage.setItem('user', JSON.stringify(userData));
    return this.afs.doc(`users/${user.uid}`).set(userData, { merge: true });
  }

  public logout() {
    return this.afAuth.signOut().then(() => {
      localStorage.clear();
      this.router.navigate(['login']).then();
    });
  }
}
