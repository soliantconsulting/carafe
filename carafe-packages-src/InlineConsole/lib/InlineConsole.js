"use strict";

import 'jquery.terminal';
import 'jquery.terminal/css/jquery.terminal.css';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import './InlineConsole.css';

export default class InlineConsole {
    constructor(options) {
        this.defaults = jQuery.extend({
            sidebar: 'body',
            pageWrapperSelector: undefined,
            sideBarId: 'mySidenav',
            width: 350,
            navBar: undefined
        }, options);

        this.addSidebarAndToggleHtmlToPage();
        this.replaceLogFunctions();
        this.initInlineTerminal();
    }

    addSidebarAndToggleHtmlToPage() {
        this.pageWrapper = undefined !== this.defaults.pageWrapperSelector ?
            jQuery(this.defaults.pageWrapperSelector) :
            this.pageWrapper = jQuery('body:first');

        jQuery(this.defaults.sidebar).prepend(
            '<div id="' + this.defaults.sideBarId + '" class="sidenav">\n' +
            '    <div id="terminalBox"></div>\n' +
            '</div>\n'
        );

        this.sideBar = jQuery('#' + this.defaults.sideBarId);

        jQuery(this.pageWrapper).prepend(
            '<div class="icon-bar float-right">\n' +
            '    <a class="toggleTerminal" href="#">FMJC=>&nbsp;</a>\n' +
            '</div>\n'
        );

        jQuery('a.toggleTerminal').on('click', (e) => {
            let mainWidth = parseInt(this.pageWrapper.css('width'));
            let navBar = jQuery(this.defaults.navBar);
            let animationOptions = {
                duration: 200,
                queue: false
            };

            if (parseInt(this.sideBar.css('width'))) {
                this.pageWrapper.animate({"margin-right": (0) + "px"}, animationOptions);
                this.sideBar.animate({width: "0px"}, animationOptions);
            } else {
                this.pageWrapper.animate({"margin-right": (this.defaults.width) + "px"}, animationOptions);
                this.sideBar.animate({width: this.defaults.width + "px"}, animationOptions);
            }

            if (navBar) {
                let navWidth = parseInt(navBar.css('width'));
                if (parseInt(this.sideBar.css('width'))) {
                    navBar.animate({width: (navWidth + this.defaults.width) + "px"}, animationOptions);
                } else {
                    navBar.animate({width: (navWidth - this.defaults.width) + "px"}, animationOptions);
                }
            }
        });
    }

    initInlineTerminal() {
        jQuery(function ($, undefined) {
            $('#terminalBox').terminal(function (command) {
                if (command !== '') {
                    try {
                        let result = window.eval(command);
                        if (result !== undefined) {
                            this.echo(new String(result));
                        }
                    } catch (e) {
                        this.error(new String(e));
                    }
                } else {
                    this.echo('');
                }
            }, {
                greetings: 'FileMaker Javascript Console - 2018\nSoliant Consulting\n\n',
                outputLimit: -1
            });
        });
    }

    replaceLogFunctions() {
        this.oldLog = console.log;
        this.oldDebug = console.debug;

        (() => {
            let oldConsole = console.log;
            console.debug = console.log = function () {
                oldConsole.apply(this, arguments);

                for (let i = 0; i < arguments.length; i++) {
                    if (typeof arguments[i] === 'object') {
                        jQuery('#terminalBox').terminal().echo((JSON && JSON.stringify ? JSON.stringify(arguments[i], undefined, 2) : arguments[i]));
                    } else {
                        jQuery('#terminalBox').terminal().echo((new Date().toTimeString().split(' ')[0] + ': ' + arguments[i]));
                    }
                }
            }
        })();
    }

    restoreLog() {
        console.log = this.oldLog;
        console.debug = this.oldDebug;
    }
};
