import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  TemplateRef,
} from '@angular/core';
import {
  startOfDay,
  endOfDay,
  subDays,
  addDays,
  endOfMonth,
  isSameDay,
  isSameMonth,
  addHours,
  subHours,
} from 'date-fns';
import { Subject } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  CalendarEvent,
  CalendarEventAction,
  CalendarEventTimesChangedEvent,
  CalendarView,
} from 'angular-calendar';
import { ApiService } from 'src/app/services/api.service';
import { Router } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { CalendarEventActionsComponent } from 'angular-calendar/modules/common/calendar-event-actions.component';
import { User } from 'src/app/models/user';

const colors: any = {
  red: {
    primary: '#ad2121',
    secondary: '#FAE3E3'
  },
  blue: {
    primary: '#1e90ff',
    secondary: '#D1E8FF'
  },
  yellow: {
    primary: '#e3bc08',
    secondary: '#FDF1BA'
  },
};

@Component({
  selector: 'app-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit {

  constructor(
    private modal: NgbModal, 
    private api: ApiService,
    private router: Router
  ) { }

  ngOnInit() {
    this.api.authInfo$.subscribe(res => {
      if (res.isLoggedIn()) {
        console.log("uid: ", res.$uid);
        
        this.api.getAllEvents().subscribe(resp => {
          if (resp) {
            this.events = [];
            resp.forEach(event => {
              this.events.push({
                start: event.start.toDate(),
                end: event.end.toDate(),
                id: event.id,
                title: event.title,
                allDay: event.allDay,
                color: colors.red,
                resizable: {
                  beforeStart: true,
                  afterEnd: true
                },
                draggable: true
              });
            });
            this.refresh.next();
          }
        });

        this.api.getAllUsers().subscribe(users => {
          if (users) {
            this.users = users;
          }
        });
      } else {
        this.router.navigate(['register']);
      }
    });
  }
  
  @ViewChild('start') start: any;
  @ViewChild('end') end: any;
  
  @ViewChild('modalContent', { static: true }) modalContent: TemplateRef<any>;
  view: CalendarView = CalendarView.Month;
  CalendarView = CalendarView;
  viewDate: Date = new Date();
  isEdit: boolean = false;

  modalData: {
    action: string;
    event: CalendarEvent;
  };

  users: User[] = [];
  usersControl = new FormControl();
  events: CalendarEvent[] = [];
  refresh: Subject<any> = new Subject();
  activeDayIsOpen: boolean = true;

  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    console.log("date:", date, "events: ", events);
    if (isSameMonth(date, this.viewDate)) {
      if (
        (isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) ||
        events.length === 0
      ) {
        this.activeDayIsOpen = false;
      } else {
        this.activeDayIsOpen = true;
      }
      this.viewDate = date;
    }
  }

  eventTimesChanged({
    event,
    newStart,
    newEnd,
  }: CalendarEventTimesChangedEvent): void {
    this.events = this.events.map((iEvent) => {
      if (iEvent === event) {
        return {
          ...event,
          start: newStart,
          end: newEnd,
        };
      }
      return iEvent;
    });
    
    event.start = newStart;
    event.end = newEnd;
    this.saveEvent(event);
  }

  handleEvent(action: string, event: CalendarEvent): void {
    this.isEdit = true;
    this.modalData = { event, action };
  }

  saveEvent(event = null) {
    let emailSubject = '';
    if (event && event.id) {
      emailSubject = event.title;
      event.invitesSentTo = 
      this.api.updateEvent(event);
    } else if (this.modalData.event.id) {
      emailSubject = this.modalData.event.title;
      this.api.updateEvent(this.modalData.event);
    } else {
      emailSubject = this.modalData.event.title;
      this.api.addEvent(this.modalData.event);
    }
    var email = this.usersControl.value.join('; ');
    var subject = 'Invitation to ' + emailSubject;
    var emailBody = 'You have been invited to participate in ' + emailSubject + ' with participants: ' + email;
    console.log("email list: ", email);
    window.location.href = "mailto:"+email+"?subject="+subject+"&body="+emailBody;
  }

  addEvent() {
    let now = this.api.roundToNearestFive(new Date());
    let newEvent = {
      id: null,
      start: now,
      end: addHours(now, 1),
      title: 'New Event',
      allDay: false,
      color: colors.red,
      resizable: {
        beforeStart: true,
        afterEnd: true
      },
      draggable: true
    }
    this.handleEvent('new', newEvent);
  }

  deleteEvent(eventToDelete: CalendarEvent) {
    if (confirm("Delete Event?")) {
      this.events = this.events.filter((event) => event !== eventToDelete);
      if (eventToDelete.id) {
        this.api.deleteEvent(eventToDelete);
      }
    }
  }

  setView(view: CalendarView) {
    this.view = view;
  }

  closeOpenMonthViewDay() {
    this.activeDayIsOpen = false;
  }

  logout() {
    this.api.logout();
  }
}
