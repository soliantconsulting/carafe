"use strict";

export default class PostToJsFiddle {
    constructor() {
        this.snippets = {};
        this.languages = {
            html: ["html"],
            js: ["javascript", "coffeescript", "javascript1.7", "babel", "typescript"],
            css: ["css", "scss"]
        };
        this.elements = {
            playground: document.querySelectorAll("*[data-playground=jsfiddle]")
        };
        this.setupDefaults();

        jQuery("*[data-playground=jsfiddle]").on('click', (e) => {
            this.createForm(e.currentTarget)
        })
    }

    setupDefaults() {
        this.collectSnippets();
    };

    collectSnippets() {
        return this.forEach(this.elements.playground, this.collectEachSnippet);
    };

    collectEachSnippet(element) {
        let group, panes, params, url;
        this.currentSnippet = {};
        group = element.dataset.playgroundFromGroup;
        params = {
            title: element.dataset.playgroundTitle || null,
            description: element.dataset.playgroundDescription || null,
            resources: element.dataset.playgroundResources || null,
            dtd: element.dataset.playgroundDtd || "html 5",
            wrap: element.dataset.playgroundWrap || "l",
            normalize_css: element.dataset.playgroundNormalize || "no"
        };
        url = {
            framework: element.dataset.playgroundFramework || null,
            version: element.dataset.playgroundFrameworkVersion || null,
            dependencies: element.dataset.playgroundDependencies || null
        };
        panes = document.querySelectorAll("*[data-playground-group=" + group + "]");
        this.forEach(panes, this.collectEachCode);
        return this.snippets[group] = {
            url: url,
            params: this.merge(params, this.currentSnippet)
        };
    };

    attachEvents() {
        return this.addDelegation("click", this.createForm);
    };

    addDelegation(event, fn, useCapture) {
        if (useCapture == null) {
            useCapture = false;
        }
        return document.body.addEventListener(event, (function(_this) {
            return function(event) {
                let element, _ref;
                element = event.target;
                event.preventDefault();
                while (element && !((_ref = element.dataset) != null ? _ref.playground : void 0)) {
                    element = element.parentNode;
                }
                if (element) {
                    return fn.call(_this, element);
                }
            };
        })(this), useCapture);
    };

    createForm(element) {
        let group, key, snippet, value, _ref;
        group = element.dataset.playgroundFromGroup;
        snippet = this.snippets[group];
        this.form = document.createElement("form");
        this.form.method = "post";
        this.form.action = this.createUrl(snippet);
        this.form.target = "_blank";
        _ref = snippet.params;
        for (key in _ref) {
            value = _ref[key];
            this.createInputsFromParams(key, value);
        }
        document.body.appendChild(this.form);
        this.form.submit();
        return this.form.parentNode.removeChild(this.form);
    };

    createUrl(snippet) {
        let dependencies, deps, framework, fwv, url, version, _ref;
        _ref = [snippet.url.framework, snippet.url.version, snippet.url.dependencies], framework = _ref[0], version = _ref[1], dependencies = _ref[2];
        fwv = !framework ? "library/pure" : framework + "/" + version;
        deps = !dependencies ? "" : "dependencies/" + dependencies + "/";
        return url = "//jsfiddle.net/api/post/" + fwv + "/" + deps;
    };

    forEach(array, callback, scope) {
        let i, _results;
        if (scope == null) {
            scope = this;
        }
        i = 0;
        _results = [];
        while (i < array.length) {
            callback.call(scope, array[i], i);
            _results.push(i++);
        }
        return _results;
    };

    merge(options, overrides) {
        return this.extend(this.extend({}, options), overrides);
    };

    extend(object, properties) {
        let key, val;
        for (key in properties) {
            val = properties[key];
            object[key] = val;
        }
        return object;
    };

    createInputsFromParams(key, value) {
        let field;
        if (value) {
            field = document.createElement("textarea");
            field.name = key;
            field.innerHTML = value;
            return this.form.appendChild(field);
        }
    };

    collectEachCode(element) {
        let code, subtype, type;
        code = element.innerHTML;
        subtype = element.dataset.playgroundType;
        type = this.translateLanguageToBase(subtype);
        this.currentSnippet[type] = code;
        return this.currentSnippet["panel_" + type] = this.translateLanguageToId(type, subtype);
    };

    translateLanguageToBase(lookup) {
        let base, key, value, _ref;
        base = "";
        _ref = this.languages;
        for (key in _ref) {
            value = _ref[key];
            if (value.indexOf(lookup) >= 0) {
                base = key;
            }
        }
        return base;
    };

    translateLanguageToId(scope, lookup) {
        return this.languages[scope].indexOf(lookup);
    };
}
