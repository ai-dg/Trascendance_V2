"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckManager = void 0;
var AuthManager_js_1 = require("./AuthManager.js");
var CheckManager = /** @class */ (function () {
    // TODO: maybe should get Translations text in the constructor
    function CheckManager(languageManager) {
        this.auth = new AuthManager_js_1.AuthManager(function () {
            return console.log("To register user or login in someone");
        });
        this.languageManager = languageManager;
    }
    CheckManager.prototype.t = function (key) {
        return this.languageManager.t(key);
    };
    CheckManager.prototype.getElement = function (id) {
        var el = document.getElementById(id);
        if (!el)
            throw new Error("Element #".concat(id, " not found"));
        return el;
    };
    CheckManager.prototype.checkEmail = function (email) {
        var errors = [];
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            errors.push(this.t('errEmail'));
        return errors;
    };
    CheckManager.prototype.checkPassword = function (passwd) {
        var errors = [];
        if (passwd.length < 8)
            errors.push(this.t('errLength'));
        if (!/[A-Z]/.test(passwd))
            errors.push(this.t('errUpper'));
        if (!/[a-z]/.test(passwd))
            errors.push(this.t('errLower'));
        if (!/[0-9]/.test(passwd))
            errors.push(this.t('errNbr'));
        return errors;
    };
    CheckManager.prototype.checkUsername = function (login) {
        var errors = [];
        if (!/^[A-Za-z0-9]+$/.test(login)) {
            errors.push(this.t('errInvalidChars') || "Username can only have lettres and numbers");
        }
        if (login.length < 3)
            errors.push(this.t('errTooShort') || "Username too short");
        if (login.length > 20)
            errors.push(this.t('errTooLong') || "Username too long");
        return errors;
    };
    CheckManager.prototype.checkForm = function (login, email, passwd) {
        var errors = [];
        errors = errors.concat(this.checkUsername(login));
        errors = errors.concat(this.checkEmail(email));
        errors = errors.concat(this.checkPassword(passwd));
        return errors;
    };
    CheckManager.prototype.setupSignUpForm = function (form) {
        var _this = this;
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            var login = form.querySelector('#login').value.trim();
            var email = form.querySelector('#email').value.trim();
            var passwd = form.querySelector('#passwd').value.trim();
            var passwdConfirm = form.querySelector('#passwdConfirm').value.trim();
            var errorDiv = _this.getElement('formErrors');
            var errors = _this.checkForm(login, email, passwd);
            if (passwd != passwdConfirm)
                errors.concat("Passwords dont match!");
            if (errors.length > 0) {
                errorDiv.innerHTML = errors.map(function (err) { return "<p>- ".concat(err, "</p>"); }).join('');
                return;
            }
            errorDiv.innerHTML = '';
            _this.auth.registerUser(login, passwd, email, 'signup');
        });
    };
    CheckManager.prototype.setupChangePassForm = function (form, text) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            form.addEventListener("submit", function (e) {
                e.preventDefault();
                var passwd = form.querySelector('#passwd').value.trim();
                var passwdConfirm = form.querySelector('#passwdConfirm').value.trim();
                var errorDiv = _this.getElement('formErrors');
                var errors = [];
                if (!passwd || !passwdConfirm) {
                    reject(new Error("Input elements not found"));
                    return;
                }
                if (passwd != passwdConfirm)
                    errors.concat("Passwords dont match!");
                errors = errors.concat(_this.checkPassword(passwd));
                if (errors.length > 0) {
                    errorDiv.innerHTML = errors.map(function (err) { return "<p>- ".concat(err, "</p>"); }).join('');
                    return;
                }
                errorDiv.innerHTML = '';
                resolve(passwd);
            });
        });
    };
    return CheckManager;
}());
exports.CheckManager = CheckManager;
