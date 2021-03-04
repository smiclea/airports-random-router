/* eslint-disable no-dupe-class-members */

export default class RegExpUtil {
  /**
   * Returns all the matches in a string for a regular expression along with all the
   * capturing groups.
   *
   * Ex. with `getMatchArray`: `matches(/a(\d+)/g, 'a11b22a33c44')`
   * would return: `[["a11","11"],["a33","33"]]`
   * Ex. without `getMatchArray`: `matches(/a(\d+)/g, 'a11b22a33c44', true)`
   * would return: `["11","33"]`
   * 'Ex. without `getMatchArray`' is equivaluent to 'Ex. with
   * `getMatchArray`' and applying `.map(m => m[1])` to the returned result
   * @param {RegExp} exp The regular expression to execute
   * @param {string} content The string to execute
   * @param {boolean} getMatchArray Wheter to return only th
   * e first capture group for every match or the entire capture groups array.
   * @returns {string[]} The found matches
   */
  static matches(exp: RegExp, content: string, getMatchArray: true): RegExpExecArray[];

  static matches(exp: RegExp, content: string,
    getMatchArray?: false | undefined): string[];

  static matches(
    exp: RegExp, content: string,
    getMatchArray?: true | false | undefined,
  ): (string | RegExpExecArray)[] {
    const matches = []
    let match
    do {
      match = exp.exec(content)
      if (match) {
        const value = getMatchArray ? match : match[1]
        matches.push(value)
      }
    } while (match)
    return matches
  }
}
