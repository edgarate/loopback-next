// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/context
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {expect} from '@loopback/testlab';
import {Binding, sortBindingsByGroup} from '../..';

describe('BindingComparator', () => {
  const orderedGroups = ['log', 'auth'];
  const groupTagName = 'group';
  let bindings: Binding<unknown>[];
  let sortedBindingKeys: string[];

  beforeEach(givenBindings);
  beforeEach(sortBindings);

  it('sorts by group', () => {
    /**
     * Groups
     * - 'log': logger1, logger2
     * - 'auth': auth1, auth2
     */
    assertOrder('logger1', 'logger2', 'auth1', 'auth2');
  });

  it('sorts by group - unknown group comes before known ones', () => {
    /**
     * Groups
     * - 'metrics': metrics // not part of ['log', 'auth']
     * - 'log': logger1
     */
    assertOrder('metrics', 'logger1');
  });

  it('sorts by group alphabetically without ordered group', () => {
    /**
     * Groups
     * - 'metrics': metrics // not part of ['log', 'auth']
     * - 'rateLimit': rateLimit // not part of ['log', 'auth']
     */
    assertOrder('metrics', 'rateLimit');
  });

  it('sorts by binding order without group tags', () => {
    /**
     * Groups
     * - '': validator1, validator2 // not part of ['log', 'auth']
     * - 'metrics': metrics // not part of ['log', 'auth']
     * - 'log': logger1
     */
    assertOrder('validator1', 'validator2', 'metrics', 'logger1');
  });

  /**
   * The sorted bindings by group:
   * - '': validator1, validator2 // not part of ['log', 'auth']
   * - 'metrics': metrics // not part of ['log', 'auth']
   * - 'rateLimit': rateLimit // not part of ['log', 'auth']
   * - 'log': logger1, logger2
   * - 'auth': auth1, auth2
   */
  function givenBindings() {
    bindings = [
      Binding.bind('logger1').tag({[groupTagName]: 'log'}),
      Binding.bind('auth1').tag({[groupTagName]: 'auth'}),
      Binding.bind('auth2').tag({[groupTagName]: 'auth'}),
      Binding.bind('logger2').tag({[groupTagName]: 'log'}),
      Binding.bind('metrics').tag({[groupTagName]: 'metrics'}),
      Binding.bind('rateLimit').tag({[groupTagName]: 'rateLimit'}),
      Binding.bind('validator1'),
      Binding.bind('validator2'),
    ];
  }

  function sortBindings() {
    sortBindingsByGroup(bindings, groupTagName, orderedGroups);
    sortedBindingKeys = bindings.map(b => b.key);
  }

  function assertOrder(...keys: string[]) {
    let prev: number = -1;
    let prevKey: string = '';
    for (const key of keys) {
      const current = sortedBindingKeys.indexOf(key);
      expect(current).to.greaterThan(
        prev,
        `Binding ${key} should come after ${prevKey}`,
      );
      prev = current;
      prevKey = key;
    }
  }
});
