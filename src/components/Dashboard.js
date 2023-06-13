import React, { Component } from "react";
import axios from "axios";
import classnames from "classnames";

import Loading from "./Loading";
import Panel from "./Panel";

import { setInterview } from "helpers/reducers";

import {
  getTotalInterviews,
  getLeastPopularTimeSlot,
  getMostPopularDay,
  getInterviewsPerDay,
} from "helpers/selectors";

const data = [
  {
    id: 1,
    label: "Total Interviews",
    getValue: getTotalInterviews,
  },
  {
    id: 2,
    label: "Least Popular Time Slot",
    getValue: getLeastPopularTimeSlot,
  },
  {
    id: 3,
    label: "Most Popular Day",
    getValue: getMostPopularDay,
  },
  {
    id: 4,
    label: "Interviews Per Day",
    getValue: getInterviewsPerDay,
  },
];

class Dashboard extends Component {
  state = {
    loading: true,
    focused: null,
    days: [],
    appointments: {},
    inteviewer: {},
  };
  // Instance Method
  selectPanel(id) {
    this.setState((previousState) => ({
      focused: previousState.focused !== null ? null : id,
    }));
  }
  //Lifecycle method to check to see if there is a saved focus state after we render the application the first time
  componentDidMount() {
    const focused = JSON.parse(localStorage.getItem("focused"));
    //API request
    Promise.all([
      axios.get("/api/days"),
      axios.get("/api/appointments"),
      axios.get("/api/interviewers"),
    ]).then(([days, appointments, interviewers]) => {
      this.setState({
        loading: false,
        days: days.data,
        appointments: appointments.data,
        interviewers: interviewers.data,
      });
    });

    this.socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL);
    //This event handler converts the string data to JavaScript data types. If the data is an object with the correct type, then we update the state. We use a setInterview helper function to convert the state using the id and interview values.
    //open the connects and starts listening
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (typeof data === "object" && data.type === "SET_INTERVIEW") {
        this.setState((previousState) =>
          setInterview(previousState, data.id, data.interview)
        );
      }
    };

    if (focused) {
      this.setState({ focused });
    }
  }
  //Lifecycle method to listen for changes to the state
  //comparing the previous update to the existing state, and if the values change, we write the value to localStorage
  componentDidUpdate(previousPros, previousState) {
    if (previousState.focused !== this.state.focused) {
      localStorage.setItem("focused", JSON.stringify(this.state.focused));
    }
  }

  componentWillUnmount() {
    this.socket.close();
  }

  render() {
    const dashboardClasses = classnames("dashboard", {
      "dashboard--focused": this.state.focused,
    });

    if (this.state.loading) {
      return <Loading />;
    }

    const panels = (
      this.state.focused
        ? data.filter((panel) => this.state.focused === panel.id)
        : data
    ).map((panel) => {
      return (
        <Panel
          key={panel.id}
          id={panel.id}
          label={panel.label}
          value={panel.getValue(this.state)}
          onSelect={(event) => this.selectPanel(panel.id)}
        />
      );
    });

    return <main className={dashboardClasses}>{panels}</main>;
  }
}

export default Dashboard;
