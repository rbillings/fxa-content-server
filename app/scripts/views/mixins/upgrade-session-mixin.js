/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * View mixin to support a user upgrading their session to
 * be verified. This is useful in situations where a panel
 * might contain sensitive information or security related
 * features.
 *
 * This mix-in replaces the template loaded by the view with
 * the upgrade-session template. Once the email has been
 * verified, the page is re-rendered and the user can see
 * the gated panel.
 *
 * @mixin UpgradeSessionMixin
 */

define(function (require, exports, module) {
  'use strict';

  const BaseView = require('../base');
  const preventDefaultThen = require('../base').preventDefaultThen;
  const UpgradeSessionTemplate = require('stache!templates/settings/upgrade_session');
  const t = BaseView.t;

  module.exports = {
    events: {
      'click .refresh-verification-state': preventDefaultThen('_clickRefreshVerificationState'),
      'click .send-verification-email': preventDefaultThen('_clickSendVerificationEmail')
    },

    _clickRefreshVerificationState () {
      this.model.set({
        isPanelOpen: true
      });
      return this.setupSessionGateIfRequired()
        .then((verified) => {
          if (verified) {
            this.displaySuccess(t('Primary email verified'), {
              closePanel: false
            });
          }
          return this.render();
        });
    },

    _clickSendVerificationEmail () {
      const account = this.getSignedInAccount();
      // TODO: Replace this with custom resend code function
      return account.retrySignUp(this.relier)
        .then(() => {
          this.displaySuccess(t('Verification email sent'), {
            closePanel: false
          });
        });
    },

    beforeRender() {
      return this.setupSessionGateIfRequired()
        .then((isEnabled) => {
          if (isEnabled) {
            return this._fetchEmails();
          }
        });
    },

    setupSessionGateIfRequired () {
      const account = this.getSignedInAccount();
      return account.recoveryEmailSecondaryEmailEnabled()
        .then((isEnabled) => {
          if (! isEnabled) {
            this.template = UpgradeSessionTemplate;
          } else {
            this.template = this.gatedTemplate;
          }
          return isEnabled;
        });
    }
  };
});
