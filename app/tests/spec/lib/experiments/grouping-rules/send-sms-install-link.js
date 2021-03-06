/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  const { assert } = require('chai');
  const Account = require('models/account');
  const CountryTelephoneInfo = require('lib/country-telephone-info');
  const Experiment = require('lib/experiments/grouping-rules/send-sms-install-link');
  const sinon = require('sinon');

  describe('lib/experiments/grouping-rules/send-sms-install-link', () => {
    let account;
    const country = 'GB';
    let experiment;

    beforeEach(() => {
      account = new Account({ email: 'testuser@testuser.com' });
      experiment = new Experiment();
      sinon.stub(experiment, 'uniformChoice').callsFake(() => 'choice');
    });

    describe('choose', () => {
      it('returns false if pre-reqs not met', () => {
        assert.isFalse(experiment.choose({ country, uniqueUserId: 'user-id' }));
        assert.isFalse(experiment.choose({ account, uniqueUserId: 'user-id' }));
        assert.isFalse(experiment.choose({ account, country }));
      });

      it('`signinCodes` returned if email forced', () => {
        account.set('email', 'testuser@softvision.com');
        assert.equal(experiment.choose({ account, country, uniqueUserId: 'user-id' }), 'signinCodes');
        account.set('email', 'testuser@softvision.ro');
        assert.equal(experiment.choose({ account, country, uniqueUserId: 'user-id' }), 'signinCodes');
        account.set('email', 'testuser@mozilla.com');
        assert.equal(experiment.choose({ account, country, uniqueUserId: 'user-id' }), 'signinCodes');
        account.set('email', 'testuser@mozilla.org');
        assert.equal(experiment.choose({ account, country, uniqueUserId: 'user-id' }), 'signinCodes');
      });

      describe('country has a `rolloutRate`', () => {
        it('user not selected for trail returns `false`', () => {
          sinon.stub(experiment, 'bernoulliTrial').callsFake(() => false);
          CountryTelephoneInfo.GB.rolloutRate = 0.5;
          assert.isFalse(experiment.choose({ account, country, uniqueUserId: 'user-id', }));
          assert.isTrue(experiment.bernoulliTrial.called);
          assert.isTrue(experiment.bernoulliTrial.calledWith(0.5, 'user-id'));
          assert.isFalse(experiment.uniformChoice.called);
          delete CountryTelephoneInfo.GB.rolloutRate;
        });

        it('user selected for trial delegates to `uniformChoice`', () => {
          CountryTelephoneInfo.GB.rolloutRate = 0.5;
          sinon.stub(experiment, 'bernoulliTrial').callsFake(() => true);
          assert.equal(experiment.choose({ account, country, uniqueUserId: 'user-id' }), 'choice');
          assert.isTrue(experiment.bernoulliTrial.called);
          assert.isTrue(experiment.bernoulliTrial.calledWith(0.5, 'user-id'));
          assert.isTrue(experiment.uniformChoice.called);
          assert.isTrue(experiment.uniformChoice.calledWith(['control', 'treatment', 'signinCodes'], 'user-id'));
          delete CountryTelephoneInfo.GB.rolloutRate;
        });
      });

      it('others delegate to uniformChoice', () => {
        sinon.spy(experiment, 'bernoulliTrial');
        assert.equal(experiment.choose({ account, country, uniqueUserId: 'user-id' }), 'choice');
        assert.isFalse(experiment.bernoulliTrial.called);
        assert.isTrue(experiment.uniformChoice.calledOnce);
        assert.isTrue(experiment.uniformChoice.calledWith(['treatment', 'signinCodes'], 'user-id'));
      });
    });
  });
});
