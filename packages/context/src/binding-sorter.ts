// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/context
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Binding} from './binding';

/**
 * Compare function to sort an array of bindings.
 * It is used by `Array.prototype.sort()`.
 */
export interface BindingComparator {
  /**
   * Compare two bindings
   * @param bindingA First binding
   * @param bindingB Second binding
   * @returns A number to determine order of bindingA and bindingB
   * - 0 leaves bindingA and bindingB unchanged
   * - <0 bindingA comes before bindingB
   * - >0 bindingA comes after bindingB
   */
  (
    bindingA: Readonly<Binding<unknown>>,
    bindingB: Readonly<Binding<unknown>>,
  ): number;
}

/**
 * Creates a binding compare function to sort bindings by tagged group name.
 * Two bindings are compared as follows:
 *
 * 1. Get the `group` value from binding tags, if not present, default to `''`
 * 2. If both bindings have `group` values in `orderedGroups`, honor the order
 * denoted by `orderedGroups`.
 * 3. If a binding's `group` does not exist in `orderedGroups`, it comes before
 * the one exists in `orderedGroups`.
 * 4. If both bindings have `group` values outside of `orderedGroups`, they are
 * ordered by group names alphabetically.
 *
 * @param groupTagName Name of the tag for group
 * @param orderedGroups An array of group names as predefined orders
 */
export function compareBindingsByGroup(
  groupTagName: string = 'group',
  orderedGroups: string[] = [],
): BindingComparator {
  return (a: Readonly<Binding<unknown>>, b: Readonly<Binding<unknown>>) => {
    const g1: string = a.tagMap[groupTagName] || '';
    const g2: string = b.tagMap[groupTagName] || '';
    const i1 = orderedGroups.indexOf(g1);
    const i2 = orderedGroups.indexOf(g2);
    if (i1 !== -1 || i2 !== -1) {
      // Honor the group order
      return i1 - i2;
    } else {
      // Neither group is in the pre-defined order
      // Use alphabetical order instead so that `1-group` is invoked before
      // `2-group`
      return g1 < g2 ? -1 : g1 > g2 ? 1 : 0;
    }
  };
}

/**
 * Sort bindings by tagged group name
 * @param bindings An array of bindings
 * @param groupTagName Tag name for group
 * @param orderedGroups An array of group names as predefined orders
 */
export function sortBindingsByGroup(
  bindings: Readonly<Binding<unknown>>[],
  groupTagName?: string,
  orderedGroups?: string[],
) {
  return bindings.sort(compareBindingsByGroup(groupTagName, orderedGroups));
}
