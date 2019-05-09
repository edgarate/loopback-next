// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/context
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Binding} from './binding';

/**
 * Compare function to sort an array of bindings.
 * It is used by `Array.prototype.sort()`.
 *
 * @example
 * ```ts
 * const compareByKey: BindingComparator = (a, b) => a.key.localeCompare(b.key);
 * ```
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
 *
 * @remarks
 * Two bindings are compared as follows:
 *
 * 1. Get values for the given tag as `group` for bindings, if the tag is not
 * present, default `group` to `''`.
 * 2. If both bindings have `group` value in `orderedGroups`, honor the order
 * specified by `orderedGroups`.
 * 3. If a binding's `group` does not exist in `orderedGroups`, it comes before
 * the one with `group` exists in `orderedGroups`.
 * 4. If both bindings have `group` value outside of `orderedGroups`, they are
 * ordered by group names alphabetically.
 *
 * @param groupTagName Name of the binding tag for group
 * @param orderedGroups An array of group names as the predefined order
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
 * Sort bindings by group names denoted by a tag and the predefined order
 *
 * @param bindings An array of bindings
 * @param groupTagName Tag name for group, for example, we can use the value
 * `'a'` of tag `order` as the group name for `binding.tag({order: 'a'})`.
 *
 * @param orderedGroups An array of group names as the predefined order
 */
export function sortBindingsByGroup(
  bindings: Readonly<Binding<unknown>>[],
  groupTagName?: string,
  orderedGroups?: string[],
) {
  return bindings.sort(compareBindingsByGroup(groupTagName, orderedGroups));
}
