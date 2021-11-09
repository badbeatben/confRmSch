import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { AngularFirestore } from 'angularfire2/firestore';
import { AngularFireAuth } from 'angularfire2/auth';
import { CalendarEvent } from 'angular-calendar';
import { User } from '../models/user';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Invitees } from '../models/invitees';

export class AuthInfo {
  constructor(public $uid: string) { }

  isLoggedIn() {
    return !!this.$uid;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  static UNKNOWN_USER = new AuthInfo(null);
  public authInfo$: BehaviorSubject<AuthInfo> = new BehaviorSubject<AuthInfo>(ApiService.UNKNOWN_USER);

  constructor(
    private db: AngularFirestore,
    private fireAuth: AngularFireAuth,
    private snackbar: MatSnackBar
  ) { 
    this.fireAuth.authState.pipe(take(1)).subscribe(user => {
      if (user) {
        this.authInfo$.next(new AuthInfo(user.uid));
      }
    });
  }

  // login and auth area
  public createAccount(email: string, password: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.fireAuth.auth.createUserWithEmailAndPassword(email, password)
        .then(res => {
          if (res.user) {
            this.authInfo$.next(new AuthInfo(res.user.uid));
            resolve(res.user);
          } else {
            reject(res);
          }
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  public login(email: string, password: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.fireAuth.auth.signInWithEmailAndPassword(email, password)
        .then(res => {
          if (res.user) {
            this.authInfo$.next(new AuthInfo(res.user.uid));
            resolve(res.user);
          }
          else {
            reject(res.user);
          }
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  public signInAnonymously() {
    return new Promise<any>((resolve, reject) => {
      this.fireAuth.auth.signInAnonymously()
        .then(res => {
          if (res.user) {
            resolve(res.user);
          }
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  public logout(): Promise<void> {
    this.authInfo$.next(ApiService.UNKNOWN_USER);
    return this.fireAuth.auth.signOut();
  }

  public checkAuth() {
    return new Promise((resolve) => {
      this.fireAuth.auth.onAuthStateChanged(user => {
        resolve(user);
      });
    });
  }

  public checkIfEmailTaken(email: string): Observable<any> {
    return this.db.collection('users', ref => ref.where('email', '==', email)).snapshotChanges();
  }
  // End login and auth area
  
  // Events Region
  roundToNearestFive(date: Date): Date {
    var coeff = 1000 * 60 * 5;
    return new Date(Math.ceil(date.getTime() / coeff) * coeff);
  }

  getEvent(id: string): Observable<CalendarEvent> {
    if (!id) return new Observable<CalendarEvent>();
    return this.db.collection('events').doc(id).valueChanges() as Observable<CalendarEvent>;
  }

  getAllEvents(): Observable<any[]> {
    return this.db.collection('events').valueChanges() as Observable<any[]>;
  }

  async addEvent(event: CalendarEvent, invitees: string = null) {
    const doc_ref = await this.db.collection('events').add(event);
    event.id = doc_ref.id;
    let inv = {
      id: 'new',
      eventId: doc_ref.id,
      invitees: invitees
    };
    
    console.log("event: ", event, "Invites: ", inv);
    this.updateEvent(event);
    this.addInvitees(inv);
  }

  updateEvent(event: CalendarEvent, invitees: string = null) {
    this.db.collection('events').doc(event.id.toString()).set(event, { merge: true }).then(success => {
      console.log('Success ', success);
      this.snackbarMessage('Event updated successfully');
    })
    .catch(error => {
      console.log('Something went wrong: ', error);
      this.snackbarMessage(error.message);
    });
    if (invitees) {
      this.getInvitees(event.id.toString()).subscribe(resp => {
        let inv = {
          id: 'new',
          invitees: invitees,
          eventId: event.id.toString()
        };
        console.log("invitee resp: ", resp);
        if (resp.length > 0) {
          inv.id = resp[0].id;
          this.updateInvitees(inv);
        } else {
          this.addInvitees(inv);
        }
      });
    }
  }

  deleteEvent(event: CalendarEvent) {
    this.db.collection('events').doc(event.id.toString()).delete().then(success => {
      console.log('Success ', success);
      this.snackbarMessage('Event deleted successfully');
    })
    .catch(error => {
      console.log('Something went wrong: ', error);
      this.snackbarMessage(error.message);
    });
  }
  // End of Events Region


  // Users Region
  getUser(id: string): Observable<User> {
    if (!id) return new Observable<User>();
    return this.db.collection('users').doc(id).valueChanges() as Observable<User>;
  }

  getAllUsers(): Observable<User[]> {
    return this.db.collection('users').valueChanges() as Observable<User[]>;
  }

  async addUser(user: User) {
    this.db.collection('users').doc(user.id).set(Object.assign({}, user)).then(success => {
      console.log('Success ', success);
      this.snackbarMessage('User added successfully');
    })
    .catch(error => {
      console.log('Something went wrong: ', error);
      this.snackbarMessage(error.message);
    });
  }

  updateUser(user: User) {
    this.db.collection('users').doc(user.id).set(user, { merge: true }).then(success => {
      console.log('Success ', success);
      this.snackbarMessage('User updated successfully');
    })
    .catch(error => {
      console.log('Something went wrong: ', error);
      this.snackbarMessage(error.message);
    });
  }

  deleteUser(user: User) {
    this.db.collection('users').doc(user.id).delete().then(success => {
      console.log('Success ', success);
      this.snackbarMessage('User deleted successfully');
    })
    .catch(error => {
      console.log('Something went wrong: ', error);
      this.snackbarMessage(error.message);
    });
  }
  // End of Users Region


  // Invitees Region
  getInvitees(id: string): Observable<any> {
    if (!id) return null;
    return this.db.collection('invitees', ref => ref.where('eventId', '==', id)).valueChanges();
  }

  async addInvitees(invitees: Invitees) {
    const doc_ref = await this.db.collection('invitees').add(invitees);
    invitees.id = doc_ref.id;
    this.updateInvitees(invitees);
  }

  updateInvitees(invitees: Invitees) {
    this.db.collection('invitees').doc(invitees.id).set(invitees, { merge: true }).then(success => {
      console.log('Invitees updated successfully', success);
    })
    .catch(error => {
      console.log('Something went wrong: ', error);
      this.snackbarMessage(error.message);
    });
  }
  // End of Invitees Region


  // Display Snackbar Message
  snackbarMessage(message: string) {
    this.snackbar.open(message, 'Okay', {
      horizontalPosition: 'center',
      verticalPosition: 'top',
      duration: 5000
    });
  }
  

}
