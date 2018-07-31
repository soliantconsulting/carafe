"use strict";

import 'jquery';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import carafeData from './ExampleData.json';
import * as fm from 'fm-webviewer-bridge'
import './lib/HeaderSidebar.css';
import moment from 'moment';

window.carafeData = carafeData;

jQuery(document).ready(function () {
    // here is a function called 'hello' that we'll expose to FM below
    const hello = ({who}) => {
        jQuery('.filemaker-field').append("<br>Hello " + who + '. - It is now: ' + moment().format('HH:mm:ss a'));
        // anything you return from a function can get
        // sent back to fm by providing a callback;
        return {message: "hello " + who}
    };

    $('.filemaker-field').html("This page was loaded at: " + moment().format('HH:mm:ss a'));

    // create the externalAPIbridge and give it a function
    //called 'hello' but expose it to FM as 'fmHello
    const exteralAPI = fm.externalAPI({fmHello: hello});
    exteralAPI.start();

    window.carafeScript = () => {
        fm.callFMScript('Carafe Example Implementation', 'Handle Callback', {"someKey":"some value"});
    };
});
