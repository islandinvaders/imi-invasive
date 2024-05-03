(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var Accounts = Package['accounts-base'].Accounts;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var check = Package.check.check;
var Match = Package.check.Match;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var Roles;

var require = meteorInstall({"node_modules":{"meteor":{"alanning:roles":{"roles":{"roles_common.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/alanning_roles/roles/roles_common.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
!function (module1) {
  /* global Meteor, Roles, Mongo */

  /**
   * Provides functions related to user authorization. Compatible with built-in Meteor accounts packages.
   *
   * Roles are accessible throgh `Meteor.roles` collection and documents consist of:
   *  - `_id`: role name
   *  - `children`: list of subdocuments:
   *    - `_id`
   *
   * Children list elements are subdocuments so that they can be easier extended in the future or by plugins.
   *
   * Roles can have multiple parents and can be children (subroles) of multiple roles.
   *
   * Example: `{_id: 'admin', children: [{_id: 'editor'}]}`
   *
   * The assignment of a role to a user is stored in a collection, accessible through `Meteor.roleAssignment`.
   * It's documents consist of
   *  - `_id`: Internal MongoDB id
   *  - `role`: A role object which got assigned. Usually only contains the `_id` property
   *  - `user`: A user object, usually only contains the `_id` property
   *  - `scope`: scope name
   *  - `inheritedRoles`: A list of all the roles objects inherited by the assigned role.
   *
   * @module Roles
   */
  if (!Meteor.roles) {
    Meteor.roles = new Mongo.Collection('roles');
  }
  if (!Meteor.roleAssignment) {
    Meteor.roleAssignment = new Mongo.Collection('role-assignment');
  }

  /**
   * @class Roles
   */
  if (typeof Roles === 'undefined') {
    Roles = {}; // eslint-disable-line no-global-assign
  }
  let getGroupsForUserDeprecationWarning = false;
  Object.assign(Roles, {
    /**
     * Used as a global group (now scope) name. Not used anymore.
     *
     * @property GLOBAL_GROUP
     * @static
     * @deprecated
     */
    GLOBAL_GROUP: null,
    /**
     * Create a new role.
     *
     * @method createRole
     * @param {String} roleName Name of role.
     * @param {Object} [options] Options:
     *   - `unlessExists`: if `true`, exception will not be thrown in the role already exists
     * @return {String} ID of the new role or null.
     * @static
     */
    createRole: function (roleName, options) {
      Roles._checkRoleName(roleName);
      options = Object.assign({
        unlessExists: false
      }, options);
      const result = Meteor.roles.upsert({
        _id: roleName
      }, {
        $setOnInsert: {
          children: []
        }
      });
      if (!result.insertedId) {
        if (options.unlessExists) return null;
        throw new Error('Role \'' + roleName + '\' already exists.');
      }
      return result.insertedId;
    },
    /**
     * Delete an existing role.
     *
     * If the role is set for any user, it is automatically unset.
     *
     * @method deleteRole
     * @param {String} roleName Name of role.
     * @static
     */
    deleteRole: function (roleName) {
      let roles;
      let inheritedRoles;
      Roles._checkRoleName(roleName);

      // Remove all assignments
      Meteor.roleAssignment.remove({
        'role._id': roleName
      });
      do {
        // For all roles who have it as a dependency ...
        roles = Roles._getParentRoleNames(Meteor.roles.findOne({
          _id: roleName
        }));
        Meteor.roles.find({
          _id: {
            $in: roles
          }
        }).fetch().forEach(r => {
          Meteor.roles.update({
            _id: r._id
          }, {
            $pull: {
              children: {
                _id: roleName
              }
            }
          });
          inheritedRoles = Roles._getInheritedRoleNames(Meteor.roles.findOne({
            _id: r._id
          }));
          Meteor.roleAssignment.update({
            'role._id': r._id
          }, {
            $set: {
              inheritedRoles: [r._id, ...inheritedRoles].map(r2 => ({
                _id: r2
              }))
            }
          }, {
            multi: true
          });
        });
      } while (roles.length > 0);

      // And finally remove the role itself
      Meteor.roles.remove({
        _id: roleName
      });
    },
    /**
     * Rename an existing role.
     *
     * @method renameRole
     * @param {String} oldName Old name of a role.
     * @param {String} newName New name of a role.
     * @static
     */
    renameRole: function (oldName, newName) {
      let count;
      Roles._checkRoleName(oldName);
      Roles._checkRoleName(newName);
      if (oldName === newName) return;
      const role = Meteor.roles.findOne({
        _id: oldName
      });
      if (!role) {
        throw new Error('Role \'' + oldName + '\' does not exist.');
      }
      role._id = newName;
      Meteor.roles.insert(role);
      do {
        count = Meteor.roleAssignment.update({
          'role._id': oldName
        }, {
          $set: {
            'role._id': newName
          }
        }, {
          multi: true
        });
      } while (count > 0);
      do {
        count = Meteor.roleAssignment.update({
          'inheritedRoles._id': oldName
        }, {
          $set: {
            'inheritedRoles.$._id': newName
          }
        }, {
          multi: true
        });
      } while (count > 0);
      do {
        count = Meteor.roles.update({
          'children._id': oldName
        }, {
          $set: {
            'children.$._id': newName
          }
        }, {
          multi: true
        });
      } while (count > 0);
      Meteor.roles.remove({
        _id: oldName
      });
    },
    /**
     * Add role parent to roles.
     *
     * Previous parents are kept (role can have multiple parents). For users which have the
     * parent role set, new subroles are added automatically.
     *
     * @method addRolesToParent
     * @param {Array|String} rolesNames Name(s) of role(s).
     * @param {String} parentName Name of parent role.
     * @static
     */
    addRolesToParent: function (rolesNames, parentName) {
      // ensure arrays
      if (!Array.isArray(rolesNames)) rolesNames = [rolesNames];
      rolesNames.forEach(function (roleName) {
        Roles._addRoleToParent(roleName, parentName);
      });
    },
    /**
     * @method _addRoleToParent
     * @param {String} roleName Name of role.
     * @param {String} parentName Name of parent role.
     * @private
     * @static
     */
    _addRoleToParent: function (roleName, parentName) {
      Roles._checkRoleName(roleName);
      Roles._checkRoleName(parentName);

      // query to get role's children
      const role = Meteor.roles.findOne({
        _id: roleName
      });
      if (!role) {
        throw new Error('Role \'' + roleName + '\' does not exist.');
      }

      // detect cycles
      if (Roles._getInheritedRoleNames(role).includes(parentName)) {
        throw new Error('Roles \'' + roleName + '\' and \'' + parentName + '\' would form a cycle.');
      }
      const count = Meteor.roles.update({
        _id: parentName,
        'children._id': {
          $ne: role._id
        }
      }, {
        $push: {
          children: {
            _id: role._id
          }
        }
      });

      // if there was no change, parent role might not exist, or role is
      // already a subrole; in any case we do not have anything more to do
      if (!count) return;
      Meteor.roleAssignment.update({
        'inheritedRoles._id': parentName
      }, {
        $push: {
          inheritedRoles: {
            $each: [role._id, ...Roles._getInheritedRoleNames(role)].map(r => ({
              _id: r
            }))
          }
        }
      }, {
        multi: true
      });
    },
    /**
     * Remove role parent from roles.
     *
     * Other parents are kept (role can have multiple parents). For users which have the
     * parent role set, removed subrole is removed automatically.
     *
     * @method removeRolesFromParent
     * @param {Array|String} rolesNames Name(s) of role(s).
     * @param {String} parentName Name of parent role.
     * @static
     */
    removeRolesFromParent: function (rolesNames, parentName) {
      // ensure arrays
      if (!Array.isArray(rolesNames)) rolesNames = [rolesNames];
      rolesNames.forEach(function (roleName) {
        Roles._removeRoleFromParent(roleName, parentName);
      });
    },
    /**
     * @method _removeRoleFromParent
     * @param {String} roleName Name of role.
     * @param {String} parentName Name of parent role.
     * @private
     * @static
     */
    _removeRoleFromParent: function (roleName, parentName) {
      Roles._checkRoleName(roleName);
      Roles._checkRoleName(parentName);

      // check for role existence
      // this would not really be needed, but we are trying to match addRolesToParent
      const role = Meteor.roles.findOne({
        _id: roleName
      }, {
        fields: {
          _id: 1
        }
      });
      if (!role) {
        throw new Error('Role \'' + roleName + '\' does not exist.');
      }
      const count = Meteor.roles.update({
        _id: parentName
      }, {
        $pull: {
          children: {
            _id: role._id
          }
        }
      });

      // if there was no change, parent role might not exist, or role was
      // already not a subrole; in any case we do not have anything more to do
      if (!count) return;

      // For all roles who have had it as a dependency ...
      const roles = [...Roles._getParentRoleNames(Meteor.roles.findOne({
        _id: parentName
      })), parentName];
      Meteor.roles.find({
        _id: {
          $in: roles
        }
      }).fetch().forEach(r => {
        const inheritedRoles = Roles._getInheritedRoleNames(Meteor.roles.findOne({
          _id: r._id
        }));
        Meteor.roleAssignment.update({
          'role._id': r._id,
          'inheritedRoles._id': role._id
        }, {
          $set: {
            inheritedRoles: [r._id, ...inheritedRoles].map(r2 => ({
              _id: r2
            }))
          }
        }, {
          multi: true
        });
      });
    },
    /**
     * Add users to roles.
     *
     * Adds roles to existing roles for each user.
     *
     * @example
     *     Roles.addUsersToRoles(userId, 'admin')
     *     Roles.addUsersToRoles(userId, ['view-secrets'], 'example.com')
     *     Roles.addUsersToRoles([user1, user2], ['user','editor'])
     *     Roles.addUsersToRoles([user1, user2], ['glorious-admin', 'perform-action'], 'example.org')
     *
     * @method addUsersToRoles
     * @param {Array|String} users User ID(s) or object(s) with an `_id` field.
     * @param {Array|String} roles Name(s) of roles to add users to. Roles have to exist.
     * @param {Object|String} [options] Options:
     *   - `scope`: name of the scope, or `null` for the global role
     *   - `ifExists`: if `true`, do not throw an exception if the role does not exist
     *
     * Alternatively, it can be a scope name string.
     * @static
     */
    addUsersToRoles: function (users, roles, options) {
      let id;
      if (!users) throw new Error('Missing \'users\' param.');
      if (!roles) throw new Error('Missing \'roles\' param.');
      options = Roles._normalizeOptions(options);

      // ensure arrays
      if (!Array.isArray(users)) users = [users];
      if (!Array.isArray(roles)) roles = [roles];
      Roles._checkScopeName(options.scope);
      options = Object.assign({
        ifExists: false
      }, options);
      users.forEach(function (user) {
        if (typeof user === 'object') {
          id = user._id;
        } else {
          id = user;
        }
        roles.forEach(function (role) {
          Roles._addUserToRole(id, role, options);
        });
      });
    },
    /**
     * Set users' roles.
     *
     * Replaces all existing roles with a new set of roles.
     *
     * @example
     *     Roles.setUserRoles(userId, 'admin')
     *     Roles.setUserRoles(userId, ['view-secrets'], 'example.com')
     *     Roles.setUserRoles([user1, user2], ['user','editor'])
     *     Roles.setUserRoles([user1, user2], ['glorious-admin', 'perform-action'], 'example.org')
     *
     * @method setUserRoles
     * @param {Array|String} users User ID(s) or object(s) with an `_id` field.
     * @param {Array|String} roles Name(s) of roles to add users to. Roles have to exist.
     * @param {Object|String} [options] Options:
     *   - `scope`: name of the scope, or `null` for the global role
     *   - `anyScope`: if `true`, remove all roles the user has, of any scope, if `false`, only the one in the same scope
     *   - `ifExists`: if `true`, do not throw an exception if the role does not exist
     *
     * Alternatively, it can be a scope name string.
     * @static
     */
    setUserRoles: function (users, roles, options) {
      let id;
      if (!users) throw new Error('Missing \'users\' param.');
      if (!roles) throw new Error('Missing \'roles\' param.');
      options = Roles._normalizeOptions(options);

      // ensure arrays
      if (!Array.isArray(users)) users = [users];
      if (!Array.isArray(roles)) roles = [roles];
      Roles._checkScopeName(options.scope);
      options = Object.assign({
        ifExists: false,
        anyScope: false
      }, options);
      users.forEach(function (user) {
        if (typeof user === 'object') {
          id = user._id;
        } else {
          id = user;
        }
        // we first clear all roles for the user
        const selector = {
          'user._id': id
        };
        if (!options.anyScope) {
          selector.scope = options.scope;
        }
        Meteor.roleAssignment.remove(selector);

        // and then add all
        roles.forEach(function (role) {
          Roles._addUserToRole(id, role, options);
        });
      });
    },
    /**
     * Add one user to one role.
     *
     * @method _addUserToRole
     * @param {String} userId The user ID.
     * @param {String} roleName Name of the role to add the user to. The role have to exist.
     * @param {Object} options Options:
     *   - `scope`: name of the scope, or `null` for the global role
     *   - `ifExists`: if `true`, do not throw an exception if the role does not exist
     * @private
     * @static
     */
    _addUserToRole: function (userId, roleName, options) {
      Roles._checkRoleName(roleName);
      Roles._checkScopeName(options.scope);
      if (!userId) {
        return;
      }
      const role = Meteor.roles.findOne({
        _id: roleName
      }, {
        fields: {
          children: 1
        }
      });
      if (!role) {
        if (options.ifExists) {
          return [];
        } else {
          throw new Error('Role \'' + roleName + '\' does not exist.');
        }
      }

      // This might create duplicates, because we don't have a unique index, but that's all right. In case there are two, withdrawing the role will effectively kill them both.
      const res = Meteor.roleAssignment.upsert({
        'user._id': userId,
        'role._id': roleName,
        scope: options.scope
      }, {
        $setOnInsert: {
          user: {
            _id: userId
          },
          role: {
            _id: roleName
          },
          scope: options.scope
        }
      });
      if (res.insertedId) {
        Meteor.roleAssignment.update({
          _id: res.insertedId
        }, {
          $set: {
            inheritedRoles: [roleName, ...Roles._getInheritedRoleNames(role)].map(r => ({
              _id: r
            }))
          }
        });
      }
      return res;
    },
    /**
     * Returns an array of role names the given role name is a child of.
     *
     * @example
     *     Roles._getParentRoleNames({ _id: 'admin', children; [] })
     *
     * @method _getParentRoleNames
     * @param {object} role The role object
     * @private
     * @static
     */
    _getParentRoleNames: function (role) {
      if (!role) {
        return [];
      }
      const parentRoles = new Set([role._id]);
      parentRoles.forEach(roleName => {
        Meteor.roles.find({
          'children._id': roleName
        }).fetch().forEach(parentRole => {
          parentRoles.add(parentRole._id);
        });
      });
      parentRoles.delete(role._id);
      return [...parentRoles];
    },
    /**
     * Returns an array of role names the given role name is a parent of.
     *
     * @example
     *     Roles._getInheritedRoleNames({ _id: 'admin', children; [] })
     *
     * @method _getInheritedRoleNames
     * @param {object} role The role object
     * @private
     * @static
     */
    _getInheritedRoleNames: function (role) {
      const inheritedRoles = new Set();
      const nestedRoles = new Set([role]);
      nestedRoles.forEach(r => {
        const roles = Meteor.roles.find({
          _id: {
            $in: r.children.map(r => r._id)
          }
        }, {
          fields: {
            children: 1
          }
        }).fetch();
        roles.forEach(r2 => {
          inheritedRoles.add(r2._id);
          nestedRoles.add(r2);
        });
      });
      return [...inheritedRoles];
    },
    /**
     * Remove users from assigned roles.
     *
     * @example
     *     Roles.removeUsersFromRoles(userId, 'admin')
     *     Roles.removeUsersFromRoles([userId, user2], ['editor'])
     *     Roles.removeUsersFromRoles(userId, ['user'], 'group1')
     *
     * @method removeUsersFromRoles
     * @param {Array|String} users User ID(s) or object(s) with an `_id` field.
     * @param {Array|String} roles Name(s) of roles to remove users from. Roles have to exist.
     * @param {Object|String} [options] Options:
     *   - `scope`: name of the scope, or `null` for the global role
     *   - `anyScope`: if set, role can be in any scope (`scope` option is ignored)
     *
     * Alternatively, it can be a scope name string.
     * @static
     */
    removeUsersFromRoles: function (users, roles, options) {
      if (!users) throw new Error('Missing \'users\' param.');
      if (!roles) throw new Error('Missing \'roles\' param.');
      options = Roles._normalizeOptions(options);

      // ensure arrays
      if (!Array.isArray(users)) users = [users];
      if (!Array.isArray(roles)) roles = [roles];
      Roles._checkScopeName(options.scope);
      users.forEach(function (user) {
        if (!user) return;
        roles.forEach(function (role) {
          let id;
          if (typeof user === 'object') {
            id = user._id;
          } else {
            id = user;
          }
          Roles._removeUserFromRole(id, role, options);
        });
      });
    },
    /**
     * Remove one user from one role.
     *
     * @method _removeUserFromRole
     * @param {String} userId The user ID.
     * @param {String} roleName Name of the role to add the user to. The role have to exist.
     * @param {Object} options Options:
     *   - `scope`: name of the scope, or `null` for the global role
     *   - `anyScope`: if set, role can be in any scope (`scope` option is ignored)
     * @private
     * @static
     */
    _removeUserFromRole: function (userId, roleName, options) {
      Roles._checkRoleName(roleName);
      Roles._checkScopeName(options.scope);
      if (!userId) return;
      const selector = {
        'user._id': userId,
        'role._id': roleName
      };
      if (!options.anyScope) {
        selector.scope = options.scope;
      }
      Meteor.roleAssignment.remove(selector);
    },
    /**
     * Check if user has specified roles.
     *
     * @example
     *     // global roles
     *     Roles.userIsInRole(user, 'admin')
     *     Roles.userIsInRole(user, ['admin','editor'])
     *     Roles.userIsInRole(userId, 'admin')
     *     Roles.userIsInRole(userId, ['admin','editor'])
     *
     *     // scope roles (global roles are still checked)
     *     Roles.userIsInRole(user, 'admin', 'group1')
     *     Roles.userIsInRole(userId, ['admin','editor'], 'group1')
     *     Roles.userIsInRole(userId, ['admin','editor'], {scope: 'group1'})
     *
     * @method userIsInRole
     * @param {String|Object} user User ID or an actual user object.
     * @param {Array|String} roles Name of role or an array of roles to check against. If array,
     *                             will return `true` if user is in _any_ role.
     *                             Roles do not have to exist.
     * @param {Object|String} [options] Options:
     *   - `scope`: name of the scope; if supplied, limits check to just that scope
     *     the user's global roles will always be checked whether scope is specified or not
     *   - `anyScope`: if set, role can be in any scope (`scope` option is ignored)
     *
     * Alternatively, it can be a scope name string.
     * @return {Boolean} `true` if user is in _any_ of the target roles
     * @static
     */
    userIsInRole: function (user, roles, options) {
      let id;
      options = Roles._normalizeOptions(options);

      // ensure array to simplify code
      if (!Array.isArray(roles)) roles = [roles];
      roles = roles.filter(r => r != null);
      if (!roles.length) return false;
      Roles._checkScopeName(options.scope);
      options = Object.assign({
        anyScope: false
      }, options);
      if (user && typeof user === 'object') {
        id = user._id;
      } else {
        id = user;
      }
      if (!id) return false;
      if (typeof id !== 'string') return false;
      const selector = {
        'user._id': id
      };
      if (!options.anyScope) {
        selector.scope = {
          $in: [options.scope, null]
        };
      }
      return roles.some(roleName => {
        selector['inheritedRoles._id'] = roleName;
        return Meteor.roleAssignment.find(selector, {
          limit: 1
        }).count() > 0;
      });
    },
    /**
     * Retrieve user's roles.
     *
     * @method getRolesForUser
     * @param {String|Object} user User ID or an actual user object.
     * @param {Object|String} [options] Options:
     *   - `scope`: name of scope to provide roles for; if not specified, global roles are returned
     *   - `anyScope`: if set, role can be in any scope (`scope` and `onlyAssigned` options are ignored)
     *   - `onlyScoped`: if set, only roles in the specified scope are returned
     *   - `onlyAssigned`: return only assigned roles and not automatically inferred (like subroles)
     *   - `fullObjects`: return full roles objects (`true`) or just names (`false`) (`onlyAssigned` option is ignored) (default `false`)
     *     If you have a use-case for this option, please file a feature-request. You shouldn't need to use it as it's
     *     result strongly dependent on the internal data structure of this plugin.
     *
     * Alternatively, it can be a scope name string.
     * @return {Array} Array of user's roles, unsorted.
     * @static
     */
    getRolesForUser: function (user, options) {
      let id;
      options = Roles._normalizeOptions(options);
      Roles._checkScopeName(options.scope);
      options = Object.assign({
        fullObjects: false,
        onlyAssigned: false,
        anyScope: false,
        onlyScoped: false
      }, options);
      if (user && typeof user === 'object') {
        id = user._id;
      } else {
        id = user;
      }
      if (!id) return [];
      const selector = {
        'user._id': id
      };
      const filter = {
        fields: {
          'inheritedRoles._id': 1
        }
      };
      if (!options.anyScope) {
        selector.scope = {
          $in: [options.scope]
        };
        if (!options.onlyScoped) {
          selector.scope.$in.push(null);
        }
      }
      if (options.onlyAssigned) {
        delete filter.fields['inheritedRoles._id'];
        filter.fields['role._id'] = 1;
      }
      if (options.fullObjects) {
        delete filter.fields;
      }
      const roles = Meteor.roleAssignment.find(selector, filter).fetch();
      if (options.fullObjects) {
        return roles;
      }
      return [...new Set(roles.reduce((rev, current) => {
        if (current.inheritedRoles) {
          return rev.concat(current.inheritedRoles.map(r => r._id));
        } else if (current.role) {
          rev.push(current.role._id);
        }
        return rev;
      }, []))];
    },
    /**
     * Retrieve cursor of all existing roles.
     *
     * @method getAllRoles
     * @param {Object} queryOptions Options which are passed directly
     *                                through to `Meteor.roles.find(query, options)`.
     * @return {Cursor} Cursor of existing roles.
     * @static
     */
    getAllRoles: function (queryOptions) {
      queryOptions = queryOptions || {
        sort: {
          _id: 1
        }
      };
      return Meteor.roles.find({}, queryOptions);
    },
    /**
     * Retrieve all users who are in target role.
     *
     * Options:
     *
     * @method getUsersInRole
     * @param {Array|String} roles Name of role or an array of roles. If array, users
     *                             returned will have at least one of the roles
     *                             specified but need not have _all_ roles.
     *                             Roles do not have to exist.
     * @param {Object|String} [options] Options:
     *   - `scope`: name of the scope to restrict roles to; user's global
     *     roles will also be checked
     *   - `anyScope`: if set, role can be in any scope (`scope` option is ignored)
     *   - `onlyScoped`: if set, only roles in the specified scope are returned
     *   - `queryOptions`: options which are passed directly
     *     through to `Meteor.users.find(query, options)`
     *
     * Alternatively, it can be a scope name string.
     * @param {Object} [queryOptions] Options which are passed directly
     *                                through to `Meteor.users.find(query, options)`
     * @return {Cursor} Cursor of users in roles.
     * @static
     */
    getUsersInRole: function (roles, options, queryOptions) {
      const ids = Roles.getUserAssignmentsForRole(roles, options).fetch().map(a => a.user._id);
      return Meteor.users.find({
        _id: {
          $in: ids
        }
      }, options && options.queryOptions || queryOptions || {});
    },
    /**
     * Retrieve all assignments of a user which are for the target role.
     *
     * Options:
     *
     * @method getUserAssignmentsForRole
     * @param {Array|String} roles Name of role or an array of roles. If array, users
     *                             returned will have at least one of the roles
     *                             specified but need not have _all_ roles.
     *                             Roles do not have to exist.
     * @param {Object|String} [options] Options:
     *   - `scope`: name of the scope to restrict roles to; user's global
     *     roles will also be checked
     *   - `anyScope`: if set, role can be in any scope (`scope` option is ignored)
     *   - `queryOptions`: options which are passed directly
     *     through to `Meteor.roleAssignment.find(query, options)`
     *
     * Alternatively, it can be a scope name string.
     * @return {Cursor} Cursor of user assignments for roles.
     * @static
     */
    getUserAssignmentsForRole: function (roles, options) {
      options = Roles._normalizeOptions(options);
      options = Object.assign({
        anyScope: false,
        queryOptions: {}
      }, options);
      return Roles._getUsersInRoleCursor(roles, options, options.queryOptions);
    },
    /**
     * @method _getUsersInRoleCursor
     * @param {Array|String} roles Name of role or an array of roles. If array, ids of users are
     *                             returned which have at least one of the roles
     *                             assigned but need not have _all_ roles.
     *                             Roles do not have to exist.
     * @param {Object|String} [options] Options:
     *   - `scope`: name of the scope to restrict roles to; user's global
     *     roles will also be checked
     *   - `anyScope`: if set, role can be in any scope (`scope` option is ignored)
     *
     * Alternatively, it can be a scope name string.
     * @param {Object} [filter] Options which are passed directly
     *                                through to `Meteor.roleAssignment.find(query, options)`
     * @return {Object} Cursor to the assignment documents
     * @private
     * @static
     */
    _getUsersInRoleCursor: function (roles, options, filter) {
      options = Roles._normalizeOptions(options);
      options = Object.assign({
        anyScope: false,
        onlyScoped: false
      }, options);

      // ensure array to simplify code
      if (!Array.isArray(roles)) roles = [roles];
      Roles._checkScopeName(options.scope);
      filter = Object.assign({
        fields: {
          'user._id': 1
        }
      }, filter);
      const selector = {
        'inheritedRoles._id': {
          $in: roles
        }
      };
      if (!options.anyScope) {
        selector.scope = {
          $in: [options.scope]
        };
        if (!options.onlyScoped) {
          selector.scope.$in.push(null);
        }
      }
      return Meteor.roleAssignment.find(selector, filter);
    },
    /**
     * Deprecated. Use `getScopesForUser` instead.
     *
     * @method getGroupsForUser
     * @static
     * @deprecated
     */
    getGroupsForUser: function () {
      if (!getGroupsForUserDeprecationWarning) {
        getGroupsForUserDeprecationWarning = true;
        console && console.warn('getGroupsForUser has been deprecated. Use getScopesForUser instead.');
      }
      return Roles.getScopesForUser(...arguments);
    },
    /**
     * Retrieve users scopes, if any.
     *
     * @method getScopesForUser
     * @param {String|Object} user User ID or an actual user object.
     * @param {Array|String} [roles] Name of roles to restrict scopes to.
     *
     * @return {Array} Array of user's scopes, unsorted.
     * @static
     */
    getScopesForUser: function (user, roles) {
      let id;
      if (roles && !Array.isArray(roles)) roles = [roles];
      if (user && typeof user === 'object') {
        id = user._id;
      } else {
        id = user;
      }
      if (!id) return [];
      const selector = {
        'user._id': id,
        scope: {
          $ne: null
        }
      };
      if (roles) {
        selector['inheritedRoles._id'] = {
          $in: roles
        };
      }
      const scopes = Meteor.roleAssignment.find(selector, {
        fields: {
          scope: 1
        }
      }).fetch().map(obi => obi.scope);
      return [...new Set(scopes)];
    },
    /**
     * Rename a scope.
     *
     * Roles assigned with a given scope are changed to be under the new scope.
     *
     * @method renameScope
     * @param {String} oldName Old name of a scope.
     * @param {String} newName New name of a scope.
     * @static
     */
    renameScope: function (oldName, newName) {
      let count;
      Roles._checkScopeName(oldName);
      Roles._checkScopeName(newName);
      if (oldName === newName) return;
      do {
        count = Meteor.roleAssignment.update({
          scope: oldName
        }, {
          $set: {
            scope: newName
          }
        }, {
          multi: true
        });
      } while (count > 0);
    },
    /**
     * Remove a scope.
     *
     * Roles assigned with a given scope are removed.
     *
     * @method removeScope
     * @param {String} name The name of a scope.
     * @static
     */
    removeScope: function (name) {
      Roles._checkScopeName(name);
      Meteor.roleAssignment.remove({
        scope: name
      });
    },
    /**
     * Throw an exception if `roleName` is an invalid role name.
     *
     * @method _checkRoleName
     * @param {String} roleName A role name to match against.
     * @private
     * @static
     */
    _checkRoleName: function (roleName) {
      if (!roleName || typeof roleName !== 'string' || roleName.trim() !== roleName) {
        throw new Error('Invalid role name \'' + roleName + '\'.');
      }
    },
    /**
     * Find out if a role is an ancestor of another role.
     *
     * WARNING: If you check this on the client, please make sure all roles are published.
     *
     * @method isParentOf
     * @param {String} parentRoleName The role you want to research.
     * @param {String} childRoleName The role you expect to be among the children of parentRoleName.
     * @static
     */
    isParentOf: function (parentRoleName, childRoleName) {
      if (parentRoleName === childRoleName) {
        return true;
      }
      if (parentRoleName == null || childRoleName == null) {
        return false;
      }
      Roles._checkRoleName(parentRoleName);
      Roles._checkRoleName(childRoleName);
      let rolesToCheck = [parentRoleName];
      while (rolesToCheck.length !== 0) {
        const roleName = rolesToCheck.pop();
        if (roleName === childRoleName) {
          return true;
        }
        const role = Meteor.roles.findOne({
          _id: roleName
        });

        // This should not happen, but this is a problem to address at some other time.
        if (!role) continue;
        rolesToCheck = rolesToCheck.concat(role.children.map(r => r._id));
      }
      return false;
    },
    /**
     * Normalize options.
     *
     * @method _normalizeOptions
     * @param {Object} options Options to normalize.
     * @return {Object} Normalized options.
     * @private
     * @static
     */
    _normalizeOptions: function (options) {
      options = options === undefined ? {} : options;
      if (options === null || typeof options === 'string') {
        options = {
          scope: options
        };
      }
      options.scope = Roles._normalizeScopeName(options.scope);
      return options;
    },
    /**
     * Normalize scope name.
     *
     * @method _normalizeScopeName
     * @param {String} scopeName A scope name to normalize.
     * @return {String} Normalized scope name.
     * @private
     * @static
     */
    _normalizeScopeName: function (scopeName) {
      // map undefined and null to null
      if (scopeName == null) {
        return null;
      } else {
        return scopeName;
      }
    },
    /**
     * Throw an exception if `scopeName` is an invalid scope name.
     *
     * @method _checkRoleName
     * @param {String} scopeName A scope name to match against.
     * @private
     * @static
     */
    _checkScopeName: function (scopeName) {
      if (scopeName === null) return;
      if (!scopeName || typeof scopeName !== 'string' || scopeName.trim() !== scopeName) {
        throw new Error('Invalid scope name \'' + scopeName + '\'.');
      }
    }
  });
}.call(this, module);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"roles_common_async.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/alanning_roles/roles/roles_common_async.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
!function (module1) {
  let Meteor;
  module1.link("meteor/meteor", {
    Meteor(v) {
      Meteor = v;
    }
  }, 0);
  let Mongo;
  module1.link("meteor/mongo", {
    Mongo(v) {
      Mongo = v;
    }
  }, 1);
  /**
   * Provides functions related to user authorization. Compatible with built-in Meteor accounts packages.
   *
   * Roles are accessible throgh `Meteor.roles` collection and documents consist of:
   *  - `_id`: role name
   *  - `children`: list of subdocuments:
   *    - `_id`
   *
   * Children list elements are subdocuments so that they can be easier extended in the future or by plugins.
   *
   * Roles can have multiple parents and can be children (subroles) of multiple roles.
   *
   * Example: `{_id: 'admin', children: [{_id: 'editor'}]}`
   *
   * The assignment of a role to a user is stored in a collection, accessible through `Meteor.roleAssignment`.
   * It's documents consist of
   *  - `_id`: Internal MongoDB id
   *  - `role`: A role object which got assigned. Usually only contains the `_id` property
   *  - `user`: A user object, usually only contains the `_id` property
   *  - `scope`: scope name
   *  - `inheritedRoles`: A list of all the roles objects inherited by the assigned role.
   *
   * @module Roles
   */
  if (!Meteor.roles) {
    Meteor.roles = new Mongo.Collection('roles');
  }
  if (!Meteor.roleAssignment) {
    Meteor.roleAssignment = new Mongo.Collection('role-assignment');
  }

  /**
   * @class Roles
   */
  if (typeof Roles === 'undefined') {
    Roles = {}; // eslint-disable-line no-global-assign
  }
  let getGroupsForUserDeprecationWarning = false;

  /**
   * Helper, resolves async some
   * @param {*} arr
   * @param {*} predicate
   * @returns {Promise<Boolean>}
   */
  const asyncSome = (arr, predicate) => Promise.asyncApply(() => {
    for (const e of arr) {
      if (Promise.await(predicate(e))) return true;
    }
    return false;
  });
  Object.assign(Roles, {
    /**
     * Used as a global group (now scope) name. Not used anymore.
     *
     * @property GLOBAL_GROUP
     * @static
     * @deprecated
     */
    GLOBAL_GROUP: null,
    /**
     * Create a new role.
     *
     * @method createRoleAsync
     * @param {String} roleName Name of role.
     * @param {Object} [options] Options:
     *   - `unlessExists`: if `true`, exception will not be thrown in the role already exists
     * @return {Promise<String>} ID of the new role or null.
     * @static
     */
    createRoleAsync: function (roleName, options) {
      return Promise.asyncApply(() => {
        Roles._checkRoleName(roleName);
        options = Object.assign({
          unlessExists: false
        }, options);
        let insertedId = null;
        const existingRole = Promise.await(Meteor.roles.findOneAsync({
          _id: roleName
        }));
        if (existingRole) {
          Promise.await(Meteor.roles.updateAsync({
            _id: roleName
          }, {
            $setOnInsert: {
              children: []
            }
          }));
          return null;
        } else {
          insertedId = Promise.await(Meteor.roles.insertAsync({
            _id: roleName,
            children: []
          }));
        }
        if (!insertedId) {
          if (options.unlessExists) return null;
          throw new Error("Role '" + roleName + "' already exists.");
        }
        return insertedId;
      });
    },
    /**
     * Delete an existing role.
     *
     * If the role is set for any user, it is automatically unset.
     *
     * @method deleteRoleAsync
     * @param {String} roleName Name of role.
     * @returns {Promise}
     * @static
     */
    deleteRoleAsync: function (roleName) {
      return Promise.asyncApply(() => {
        let roles;
        let inheritedRoles;
        Roles._checkRoleName(roleName);

        // Remove all assignments
        Promise.await(Meteor.roleAssignment.removeAsync({
          'role._id': roleName
        }));
        do {
          // For all roles who have it as a dependency ...
          roles = Roles._getParentRoleNames(Promise.await(Meteor.roles.findOneAsync({
            _id: roleName
          })));
          for (const r of Promise.await(Meteor.roles.find({
            _id: {
              $in: roles
            }
          }).fetchAsync())) {
            Promise.await(Meteor.roles.updateAsync({
              _id: r._id
            }, {
              $pull: {
                children: {
                  _id: roleName
                }
              }
            }));
            inheritedRoles = Promise.await(Roles._getInheritedRoleNamesAsync(Promise.await(Meteor.roles.findOneAsync({
              _id: r._id
            }))));
            Promise.await(Meteor.roleAssignment.updateAsync({
              'role._id': r._id
            }, {
              $set: {
                inheritedRoles: [r._id, ...inheritedRoles].map(r2 => ({
                  _id: r2
                }))
              }
            }, {
              multi: true
            }));
          }
        } while (roles.length > 0);

        // And finally remove the role itself
        Promise.await(Meteor.roles.removeAsync({
          _id: roleName
        }));
      });
    },
    /**
     * Rename an existing role.
     *
     * @method renameRoleAsync
     * @param {String} oldName Old name of a role.
     * @param {String} newName New name of a role.
     * @returns {Promise}
     * @static
     */
    renameRoleAsync: function (oldName, newName) {
      return Promise.asyncApply(() => {
        let count;
        Roles._checkRoleName(oldName);
        Roles._checkRoleName(newName);
        if (oldName === newName) return;
        const role = Promise.await(Meteor.roles.findOneAsync({
          _id: oldName
        }));
        if (!role) {
          throw new Error("Role '" + oldName + "' does not exist.");
        }
        role._id = newName;
        Promise.await(Meteor.roles.insertAsync(role));
        do {
          count = Promise.await(Meteor.roleAssignment.updateAsync({
            'role._id': oldName
          }, {
            $set: {
              'role._id': newName
            }
          }, {
            multi: true
          }));
        } while (count > 0);
        do {
          count = Promise.await(Meteor.roleAssignment.updateAsync({
            'inheritedRoles._id': oldName
          }, {
            $set: {
              'inheritedRoles.$._id': newName
            }
          }, {
            multi: true
          }));
        } while (count > 0);
        do {
          count = Promise.await(Meteor.roles.updateAsync({
            'children._id': oldName
          }, {
            $set: {
              'children.$._id': newName
            }
          }, {
            multi: true
          }));
        } while (count > 0);
        Promise.await(Meteor.roles.removeAsync({
          _id: oldName
        }));
      });
    },
    /**
     * Add role parent to roles.
     *
     * Previous parents are kept (role can have multiple parents). For users which have the
     * parent role set, new subroles are added automatically.
     *
     * @method addRolesToParentAsync
     * @param {Array|String} rolesNames Name(s) of role(s).
     * @param {String} parentName Name of parent role.
     * @returns {Promise}
     * @static
     */
    addRolesToParentAsync: function (rolesNames, parentName) {
      return Promise.asyncApply(() => {
        // ensure arrays
        if (!Array.isArray(rolesNames)) rolesNames = [rolesNames];
        for (const roleName of rolesNames) {
          Promise.await(Roles._addRoleToParentAsync(roleName, parentName));
        }
      });
    },
    /**
     * @method _addRoleToParentAsync
     * @param {String} roleName Name of role.
     * @param {String} parentName Name of parent role.
     * @returns {Promise}
     * @private
     * @static
     */
    _addRoleToParentAsync: function (roleName, parentName) {
      return Promise.asyncApply(() => {
        Roles._checkRoleName(roleName);
        Roles._checkRoleName(parentName);

        // query to get role's children
        const role = Promise.await(Meteor.roles.findOneAsync({
          _id: roleName
        }));
        if (!role) {
          throw new Error("Role '" + roleName + "' does not exist.");
        }

        // detect cycles
        if (Promise.await(Roles._getInheritedRoleNamesAsync(role)).includes(parentName)) {
          throw new Error("Roles '" + roleName + "' and '" + parentName + "' would form a cycle.");
        }
        const count = Promise.await(Meteor.roles.updateAsync({
          _id: parentName,
          'children._id': {
            $ne: role._id
          }
        }, {
          $push: {
            children: {
              _id: role._id
            }
          }
        }));

        // if there was no change, parent role might not exist, or role is
        // already a sub-role; in any case we do not have anything more to do
        if (!count) return;
        Promise.await(Meteor.roleAssignment.updateAsync({
          'inheritedRoles._id': parentName
        }, {
          $push: {
            inheritedRoles: {
              $each: [role._id, ...Promise.await(Roles._getInheritedRoleNamesAsync(role))].map(r => ({
                _id: r
              }))
            }
          }
        }, {
          multi: true
        }));
      });
    },
    /**
     * Remove role parent from roles.
     *
     * Other parents are kept (role can have multiple parents). For users which have the
     * parent role set, removed subrole is removed automatically.
     *
     * @method removeRolesFromParentAsync
     * @param {Array|String} rolesNames Name(s) of role(s).
     * @param {String} parentName Name of parent role.
     * @returns {Promise}
     * @static
     */
    removeRolesFromParentAsync: function (rolesNames, parentName) {
      return Promise.asyncApply(() => {
        // ensure arrays
        if (!Array.isArray(rolesNames)) rolesNames = [rolesNames];
        for (const roleName of rolesNames) {
          Promise.await(Roles._removeRoleFromParentAsync(roleName, parentName));
        }
      });
    },
    /**
     * @method _removeRoleFromParentAsync
     * @param {String} roleName Name of role.
     * @param {String} parentName Name of parent role.
     * @returns {Promise}
     * @private
     * @static
     */
    _removeRoleFromParentAsync: function (roleName, parentName) {
      return Promise.asyncApply(() => {
        Roles._checkRoleName(roleName);
        Roles._checkRoleName(parentName);

        // check for role existence
        // this would not really be needed, but we are trying to match addRolesToParent
        const role = Promise.await(Meteor.roles.findOneAsync({
          _id: roleName
        }, {
          fields: {
            _id: 1
          }
        }));
        if (!role) {
          throw new Error("Role '" + roleName + "' does not exist.");
        }
        const count = Promise.await(Meteor.roles.updateAsync({
          _id: parentName
        }, {
          $pull: {
            children: {
              _id: role._id
            }
          }
        }));

        // if there was no change, parent role might not exist, or role was
        // already not a subrole; in any case we do not have anything more to do
        if (!count) return;

        // For all roles who have had it as a dependency ...
        const roles = [...Promise.await(Roles._getParentRoleNamesAsync(Promise.await(Meteor.roles.findOneAsync({
          _id: parentName
        })))), parentName];
        for (const r of Promise.await(Meteor.roles.find({
          _id: {
            $in: roles
          }
        }).fetchAsync())) {
          const inheritedRoles = Promise.await(Roles._getInheritedRoleNamesAsync(Promise.await(Meteor.roles.findOneAsync({
            _id: r._id
          }))));
          Promise.await(Meteor.roleAssignment.updateAsync({
            'role._id': r._id,
            'inheritedRoles._id': role._id
          }, {
            $set: {
              inheritedRoles: [r._id, ...inheritedRoles].map(r2 => ({
                _id: r2
              }))
            }
          }, {
            multi: true
          }));
        }
      });
    },
    /**
     * Add users to roles.
     *
     * Adds roles to existing roles for each user.
     *
     * @example
     *     Roles.addUsersToRolesAsync(userId, 'admin')
     *     Roles.addUsersToRolesAsync(userId, ['view-secrets'], 'example.com')
     *     Roles.addUsersToRolesAsync([user1, user2], ['user','editor'])
     *     Roles.addUsersToRolesAsync([user1, user2], ['glorious-admin', 'perform-action'], 'example.org')
     *
     * @method addUsersToRolesAsync
     * @param {Array|String} users User ID(s) or object(s) with an `_id` field.
     * @param {Array|String} roles Name(s) of roles to add users to. Roles have to exist.
     * @param {Object|String} [options] Options:
     *   - `scope`: name of the scope, or `null` for the global role
     *   - `ifExists`: if `true`, do not throw an exception if the role does not exist
     * @returns {Promise}
     *
     * Alternatively, it can be a scope name string.
     * @static
     */
    addUsersToRolesAsync: function (users, roles, options) {
      return Promise.asyncApply(() => {
        let id;
        if (!users) throw new Error("Missing 'users' param.");
        if (!roles) throw new Error("Missing 'roles' param.");
        options = Roles._normalizeOptions(options);

        // ensure arrays
        if (!Array.isArray(users)) users = [users];
        if (!Array.isArray(roles)) roles = [roles];
        Roles._checkScopeName(options.scope);
        options = Object.assign({
          ifExists: false
        }, options);
        for (const user of users) {
          if (typeof user === 'object') {
            id = user._id;
          } else {
            id = user;
          }
          for (const role of roles) {
            Promise.await(Roles._addUserToRoleAsync(id, role, options));
          }
        }
      });
    },
    /**
     * Set users' roles.
     *
     * Replaces all existing roles with a new set of roles.
     *
     * @example
     *     await Roles.setUserRolesAsync(userId, 'admin')
     *     await Roles.setUserRolesAsync(userId, ['view-secrets'], 'example.com')
     *     await Roles.setUserRolesAsync([user1, user2], ['user','editor'])
     *     await Roles.setUserRolesAsync([user1, user2], ['glorious-admin', 'perform-action'], 'example.org')
     *
     * @method setUserRolesAsync
     * @param {Array|String} users User ID(s) or object(s) with an `_id` field.
     * @param {Array|String} roles Name(s) of roles to add users to. Roles have to exist.
     * @param {Object|String} [options] Options:
     *   - `scope`: name of the scope, or `null` for the global role
     *   - `anyScope`: if `true`, remove all roles the user has, of any scope, if `false`, only the one in the same scope
     *   - `ifExists`: if `true`, do not throw an exception if the role does not exist
     * @returns {Promise}
     *
     * Alternatively, it can be a scope name string.
     * @static
     */
    setUserRolesAsync: function (users, roles, options) {
      return Promise.asyncApply(() => {
        let id;
        if (!users) throw new Error("Missing 'users' param.");
        if (!roles) throw new Error("Missing 'roles' param.");
        options = Roles._normalizeOptions(options);

        // ensure arrays
        if (!Array.isArray(users)) users = [users];
        if (!Array.isArray(roles)) roles = [roles];
        Roles._checkScopeName(options.scope);
        options = Object.assign({
          ifExists: false,
          anyScope: false
        }, options);
        for (const user of users) {
          if (typeof user === 'object') {
            id = user._id;
          } else {
            id = user;
          }
          // we first clear all roles for the user
          const selector = {
            'user._id': id
          };
          if (!options.anyScope) {
            selector.scope = options.scope;
          }
          Promise.await(Meteor.roleAssignment.removeAsync(selector));

          // and then add all
          for (const role of roles) {
            Promise.await(Roles._addUserToRole(id, role, options));
          }
        }
      });
    },
    /**
     * Add one user to one role.
     *
     * @method _addUserToRole
     * @param {String} userId The user ID.
     * @param {String} roleName Name of the role to add the user to. The role have to exist.
     * @param {Object} options Options:
     *   - `scope`: name of the scope, or `null` for the global role
     *   - `ifExists`: if `true`, do not throw an exception if the role does not exist
     * @returns {Promise}
     * @private
     * @static
     */
    _addUserToRoleAsync: function (userId, roleName, options) {
      return Promise.asyncApply(() => {
        Roles._checkRoleName(roleName);
        Roles._checkScopeName(options.scope);
        if (!userId) {
          return;
        }
        const role = Promise.await(Meteor.roles.findOneAsync({
          _id: roleName
        }, {
          fields: {
            children: 1
          }
        }));
        if (!role) {
          if (options.ifExists) {
            return [];
          } else {
            throw new Error("Role '" + roleName + "' does not exist.");
          }
        }

        // This might create duplicates, because we don't have a unique index, but that's all right. In case there are two, withdrawing the role will effectively kill them both.
        // TODO revisit this
        /* const res = await Meteor.roleAssignment.upsertAsync(
          {
            "user._id": userId,
            "role._id": roleName,
            scope: options.scope,
          },
          {
            $setOnInsert: {
              user: { _id: userId },
              role: { _id: roleName },
              scope: options.scope,
            },
          }
        ); */
        const existingAssignment = Promise.await(Meteor.roleAssignment.findOneAsync({
          'user._id': userId,
          'role._id': roleName,
          scope: options.scope
        }));
        let insertedId;
        let res;
        if (existingAssignment) {
          Promise.await(Meteor.roleAssignment.updateAsync(existingAssignment._id, {
            $set: {
              user: {
                _id: userId
              },
              role: {
                _id: roleName
              },
              scope: options.scope
            }
          }));
          res = Promise.await(Meteor.roleAssignment.findOneAsync(existingAssignment._id));
        } else {
          insertedId = Promise.await(Meteor.roleAssignment.insertAsync({
            user: {
              _id: userId
            },
            role: {
              _id: roleName
            },
            scope: options.scope
          }));
        }
        if (insertedId) {
          Promise.await(Meteor.roleAssignment.updateAsync({
            _id: insertedId
          }, {
            $set: {
              inheritedRoles: [roleName, ...Promise.await(Roles._getInheritedRoleNamesAsync(role))].map(r => ({
                _id: r
              }))
            }
          }));
          res = Promise.await(Meteor.roleAssignment.findOneAsync({
            _id: insertedId
          }));
        }
        res.insertedId = insertedId; // For backward compatibility

        return res;
      });
    },
    /**
     * Returns an array of role names the given role name is a child of.
     *
     * @example
     *     Roles._getParentRoleNames({ _id: 'admin', children; [] })
     *
     * @method _getParentRoleNames
     * @param {object} role The role object
     * @returns {Promise}
     * @private
     * @static
     */
    _getParentRoleNamesAsync: function (role) {
      return Promise.asyncApply(() => {
        if (!role) {
          return [];
        }
        const parentRoles = new Set([role._id]);
        for (const roleName of parentRoles) {
          for (const parentRole of Promise.await(Meteor.roles.find({
            'children._id': roleName
          }).fetchAsync())) {
            parentRoles.add(parentRole._id);
          }
        }
        parentRoles.delete(role._id);
        return [...parentRoles];
      });
    },
    /**
     * Returns an array of role names the given role name is a parent of.
     *
     * @example
     *     Roles._getInheritedRoleNames({ _id: 'admin', children; [] })
     *
     * @method _getInheritedRoleNames
     * @param {object} role The role object
     * @returns {Promise}
     * @private
     * @static
     */
    _getInheritedRoleNamesAsync: function (role) {
      return Promise.asyncApply(() => {
        const inheritedRoles = new Set();
        const nestedRoles = new Set([role]);
        for (const r of nestedRoles) {
          const roles = Promise.await(Meteor.roles.find({
            _id: {
              $in: r.children.map(r => r._id)
            }
          }, {
            fields: {
              children: 1
            }
          }).fetchAsync());
          for (const r2 of roles) {
            inheritedRoles.add(r2._id);
            nestedRoles.add(r2);
          }
        }
        return [...inheritedRoles];
      });
    },
    /**
     * Remove users from assigned roles.
     *
     * @example
     *     await Roles.removeUsersFromRolesAsync(userId, 'admin')
     *     await Roles.removeUsersFromRolesAsync([userId, user2], ['editor'])
     *     await Roles.removeUsersFromRolesAsync(userId, ['user'], 'group1')
     *
     * @method removeUsersFromRolesAsync
     * @param {Array|String} users User ID(s) or object(s) with an `_id` field.
     * @param {Array|String} roles Name(s) of roles to remove users from. Roles have to exist.
     * @param {Object|String} [options] Options:
     *   - `scope`: name of the scope, or `null` for the global role
     *   - `anyScope`: if set, role can be in any scope (`scope` option is ignored)
     * @returns {Promise}
     *
     * Alternatively, it can be a scope name string.
     * @static
     */
    removeUsersFromRolesAsync: function (users, roles, options) {
      return Promise.asyncApply(() => {
        if (!users) throw new Error("Missing 'users' param.");
        if (!roles) throw new Error("Missing 'roles' param.");
        options = Roles._normalizeOptions(options);

        // ensure arrays
        if (!Array.isArray(users)) users = [users];
        if (!Array.isArray(roles)) roles = [roles];
        Roles._checkScopeName(options.scope);
        for (const user of users) {
          if (!user) return;
          for (const role of roles) {
            let id;
            if (typeof user === 'object') {
              id = user._id;
            } else {
              id = user;
            }
            Promise.await(Roles._removeUserFromRoleAsync(id, role, options));
          }
        }
      });
    },
    /**
     * Remove one user from one role.
     *
     * @method _removeUserFromRole
     * @param {String} userId The user ID.
     * @param {String} roleName Name of the role to add the user to. The role have to exist.
     * @param {Object} options Options:
     *   - `scope`: name of the scope, or `null` for the global role
     *   - `anyScope`: if set, role can be in any scope (`scope` option is ignored)
     * @returns {Promise}
     * @private
     * @static
     */
    _removeUserFromRoleAsync: function (userId, roleName, options) {
      return Promise.asyncApply(() => {
        Roles._checkRoleName(roleName);
        Roles._checkScopeName(options.scope);
        if (!userId) return;
        const selector = {
          'user._id': userId,
          'role._id': roleName
        };
        if (!options.anyScope) {
          selector.scope = options.scope;
        }
        Promise.await(Meteor.roleAssignment.removeAsync(selector));
      });
    },
    /**
     * Check if user has specified roles.
     *
     * @example
     *     // global roles
     *     await Roles.userIsInRoleAsync(user, 'admin')
     *     await Roles.userIsInRoleAsync(user, ['admin','editor'])
     *     await Roles.userIsInRoleAsync(userId, 'admin')
     *     await Roles.userIsInRoleAsync(userId, ['admin','editor'])
     *
     *     // scope roles (global roles are still checked)
     *     await Roles.userIsInRoleAsync(user, 'admin', 'group1')
     *     await Roles.userIsInRoleAsync(userId, ['admin','editor'], 'group1')
     *     await Roles.userIsInRoleAsync(userId, ['admin','editor'], {scope: 'group1'})
     *
     * @method userIsInRoleAsync
     * @param {String|Object} user User ID or an actual user object.
     * @param {Array|String} roles Name of role or an array of roles to check against. If array,
     *                             will return `true` if user is in _any_ role.
     *                             Roles do not have to exist.
     * @param {Object|String} [options] Options:
     *   - `scope`: name of the scope; if supplied, limits check to just that scope
     *     the user's global roles will always be checked whether scope is specified or not
     *   - `anyScope`: if set, role can be in any scope (`scope` option is ignored)
     *
     * Alternatively, it can be a scope name string.
     * @return {Promise<Boolean>} `true` if user is in _any_ of the target roles
     * @static
     */
    userIsInRoleAsync: function (user, roles, options) {
      return Promise.asyncApply(() => {
        let id;
        options = Roles._normalizeOptions(options);

        // ensure array to simplify code
        if (!Array.isArray(roles)) roles = [roles];
        roles = roles.filter(r => r != null);
        if (!roles.length) return false;
        Roles._checkScopeName(options.scope);
        options = Object.assign({
          anyScope: false
        }, options);
        if (user && typeof user === 'object') {
          id = user._id;
        } else {
          id = user;
        }
        if (!id) return false;
        if (typeof id !== 'string') return false;
        const selector = {
          'user._id': id
        };
        if (!options.anyScope) {
          selector.scope = {
            $in: [options.scope, null]
          };
        }
        const res = Promise.await(asyncSome(roles, roleName => Promise.asyncApply(() => {
          selector['inheritedRoles._id'] = roleName;
          const out = Promise.await(Meteor.roleAssignment.find(selector, {
            limit: 1
          }).countAsync()) > 0;
          return out;
        })));
        return res;
      });
    },
    /**
     * Retrieve user's roles.
     *
     * @method getRolesForUserAsync
     * @param {String|Object} user User ID or an actual user object.
     * @param {Object|String} [options] Options:
     *   - `scope`: name of scope to provide roles for; if not specified, global roles are returned
     *   - `anyScope`: if set, role can be in any scope (`scope` and `onlyAssigned` options are ignored)
     *   - `onlyScoped`: if set, only roles in the specified scope are returned
     *   - `onlyAssigned`: return only assigned roles and not automatically inferred (like subroles)
     *   - `fullObjects`: return full roles objects (`true`) or just names (`false`) (`onlyAssigned` option is ignored) (default `false`)
     *     If you have a use-case for this option, please file a feature-request. You shouldn't need to use it as it's
     *     result strongly dependent on the internal data structure of this plugin.
     *
     * Alternatively, it can be a scope name string.
     * @return {Promise<Array>} Array of user's roles, unsorted.
     * @static
     */
    getRolesForUserAsync: function (user, options) {
      return Promise.asyncApply(() => {
        let id;
        options = Roles._normalizeOptions(options);
        Roles._checkScopeName(options.scope);
        options = Object.assign({
          fullObjects: false,
          onlyAssigned: false,
          anyScope: false,
          onlyScoped: false
        }, options);
        if (user && typeof user === 'object') {
          id = user._id;
        } else {
          id = user;
        }
        if (!id) return [];
        const selector = {
          'user._id': id
        };
        const filter = {
          fields: {
            'inheritedRoles._id': 1
          }
        };
        if (!options.anyScope) {
          selector.scope = {
            $in: [options.scope]
          };
          if (!options.onlyScoped) {
            selector.scope.$in.push(null);
          }
        }
        if (options.onlyAssigned) {
          delete filter.fields['inheritedRoles._id'];
          filter.fields['role._id'] = 1;
        }
        if (options.fullObjects) {
          delete filter.fields;
        }
        const roles = Promise.await(Meteor.roleAssignment.find(selector, filter).fetchAsync());
        if (options.fullObjects) {
          return roles;
        }
        return [...new Set(roles.reduce((rev, current) => {
          if (current.inheritedRoles) {
            return rev.concat(current.inheritedRoles.map(r => r._id));
          } else if (current.role) {
            rev.push(current.role._id);
          }
          return rev;
        }, []))];
      });
    },
    /**
     * Retrieve cursor of all existing roles.
     *
     * @method getAllRoles
     * @param {Object} [queryOptions] Options which are passed directly
     *                                through to `Meteor.roles.find(query, options)`.
     * @return {Cursor} Cursor of existing roles.
     * @static
     */
    getAllRoles: function (queryOptions) {
      queryOptions = queryOptions || {
        sort: {
          _id: 1
        }
      };
      return Meteor.roles.find({}, queryOptions);
    },
    /**
     * Retrieve all users who are in target role.
     *
     * Options:
     *
     * @method getUsersInRoleAsync
     * @param {Array|String} roles Name of role or an array of roles. If array, users
     *                             returned will have at least one of the roles
     *                             specified but need not have _all_ roles.
     *                             Roles do not have to exist.
     * @param {Object|String} [options] Options:
     *   - `scope`: name of the scope to restrict roles to; user's global
     *     roles will also be checked
     *   - `anyScope`: if set, role can be in any scope (`scope` option is ignored)
     *   - `onlyScoped`: if set, only roles in the specified scope are returned
     *   - `queryOptions`: options which are passed directly
     *     through to `Meteor.users.find(query, options)`
     *
     * Alternatively, it can be a scope name string.
     * @param {Object} [queryOptions] Options which are passed directly
     *                                through to `Meteor.users.find(query, options)`
     * @return {Promise<Cursor>} Cursor of users in roles.
     * @static
     */
    getUsersInRoleAsync: function (roles, options, queryOptions) {
      return Promise.asyncApply(() => {
        const ids = Promise.await(Roles.getUserAssignmentsForRole(roles, options).fetchAsync()).map(a => a.user._id);
        return Meteor.users.find({
          _id: {
            $in: ids
          }
        }, options && options.queryOptions || queryOptions || {});
      });
    },
    /**
     * Retrieve all assignments of a user which are for the target role.
     *
     * Options:
     *
     * @method getUserAssignmentsForRole
     * @param {Array|String} roles Name of role or an array of roles. If array, users
     *                             returned will have at least one of the roles
     *                             specified but need not have _all_ roles.
     *                             Roles do not have to exist.
     * @param {Object|String} [options] Options:
     *   - `scope`: name of the scope to restrict roles to; user's global
     *     roles will also be checked
     *   - `anyScope`: if set, role can be in any scope (`scope` option is ignored)
     *   - `queryOptions`: options which are passed directly
     *     through to `Meteor.roleAssignment.find(query, options)`
      * Alternatively, it can be a scope name string.
     * @return {Cursor} Cursor of user assignments for roles.
     * @static
     */
    getUserAssignmentsForRole: function (roles, options) {
      options = Roles._normalizeOptions(options);
      options = Object.assign({
        anyScope: false,
        queryOptions: {}
      }, options);
      return Roles._getUsersInRoleCursor(roles, options, options.queryOptions);
    },
    /**
     * @method _getUsersInRoleCursor
     * @param {Array|String} roles Name of role or an array of roles. If array, ids of users are
     *                             returned which have at least one of the roles
     *                             assigned but need not have _all_ roles.
     *                             Roles do not have to exist.
     * @param {Object|String} [options] Options:
     *   - `scope`: name of the scope to restrict roles to; user's global
     *     roles will also be checked
     *   - `anyScope`: if set, role can be in any scope (`scope` option is ignored)
     *
     * Alternatively, it can be a scope name string.
     * @param {Object} [filter] Options which are passed directly
     *                                through to `Meteor.roleAssignment.find(query, options)`
     * @return {Object} Cursor to the assignment documents
     * @private
     * @static
     */
    _getUsersInRoleCursor: function (roles, options, filter) {
      options = Roles._normalizeOptions(options);
      options = Object.assign({
        anyScope: false,
        onlyScoped: false
      }, options);

      // ensure array to simplify code
      if (!Array.isArray(roles)) roles = [roles];
      Roles._checkScopeName(options.scope);
      filter = Object.assign({
        fields: {
          'user._id': 1
        }
      }, filter);
      const selector = {
        'inheritedRoles._id': {
          $in: roles
        }
      };
      if (!options.anyScope) {
        selector.scope = {
          $in: [options.scope]
        };
        if (!options.onlyScoped) {
          selector.scope.$in.push(null);
        }
      }
      return Meteor.roleAssignment.find(selector, filter);
    },
    /**
     * Deprecated. Use `getScopesForUser` instead.
     *
     * @method getGroupsForUserAsync
     * @returns {Promise<Array>}
     * @static
     * @deprecated
     */
    getGroupsForUserAsync: function () {
      return Promise.asyncApply(() => {
        if (!getGroupsForUserDeprecationWarning) {
          getGroupsForUserDeprecationWarning = true;
          console && console.warn('getGroupsForUser has been deprecated. Use getScopesForUser instead.');
        }
        return Promise.await(Roles.getScopesForUser(...arguments));
      });
    },
    /**
     * Retrieve users scopes, if any.
     *
     * @method getScopesForUserAsync
     * @param {String|Object} user User ID or an actual user object.
     * @param {Array|String} [roles] Name of roles to restrict scopes to.
     *
     * @return {Promise<Array>} Array of user's scopes, unsorted.
     * @static
     */
    getScopesForUserAsync: function (user, roles) {
      return Promise.asyncApply(() => {
        let id;
        if (roles && !Array.isArray(roles)) roles = [roles];
        if (user && typeof user === 'object') {
          id = user._id;
        } else {
          id = user;
        }
        if (!id) return [];
        const selector = {
          'user._id': id,
          scope: {
            $ne: null
          }
        };
        if (roles) {
          selector['inheritedRoles._id'] = {
            $in: roles
          };
        }
        const scopes = Promise.await(Meteor.roleAssignment.find(selector, {
          fields: {
            scope: 1
          }
        }).fetchAsync()).map(obi => obi.scope);
        return [...new Set(scopes)];
      });
    },
    /**
     * Rename a scope.
     *
     * Roles assigned with a given scope are changed to be under the new scope.
     *
     * @method renameScopeAsync
     * @param {String} oldName Old name of a scope.
     * @param {String} newName New name of a scope.
     * @returns {Promise}
     * @static
     */
    renameScopeAsync: function (oldName, newName) {
      return Promise.asyncApply(() => {
        let count;
        Roles._checkScopeName(oldName);
        Roles._checkScopeName(newName);
        if (oldName === newName) return;
        do {
          count = Promise.await(Meteor.roleAssignment.updateAsync({
            scope: oldName
          }, {
            $set: {
              scope: newName
            }
          }, {
            multi: true
          }));
        } while (count > 0);
      });
    },
    /**
     * Remove a scope.
     *
     * Roles assigned with a given scope are removed.
     *
     * @method removeScopeAsync
     * @param {String} name The name of a scope.
     * @returns {Promise}
     * @static
     */
    removeScopeAsync: function (name) {
      return Promise.asyncApply(() => {
        Roles._checkScopeName(name);
        Promise.await(Meteor.roleAssignment.removeAsync({
          scope: name
        }));
      });
    },
    /**
     * Throw an exception if `roleName` is an invalid role name.
     *
     * @method _checkRoleName
     * @param {String} roleName A role name to match against.
     * @private
     * @static
     */
    _checkRoleName: function (roleName) {
      if (!roleName || typeof roleName !== 'string' || roleName.trim() !== roleName) {
        throw new Error("Invalid role name '" + roleName + "'.");
      }
    },
    /**
     * Find out if a role is an ancestor of another role.
     *
     * WARNING: If you check this on the client, please make sure all roles are published.
     *
     * @method isParentOfAsync
     * @param {String} parentRoleName The role you want to research.
     * @param {String} childRoleName The role you expect to be among the children of parentRoleName.
     * @returns {Promise}
     * @static
     */
    isParentOfAsync: function (parentRoleName, childRoleName) {
      return Promise.asyncApply(() => {
        if (parentRoleName === childRoleName) {
          return true;
        }
        if (parentRoleName == null || childRoleName == null) {
          return false;
        }
        Roles._checkRoleName(parentRoleName);
        Roles._checkRoleName(childRoleName);
        let rolesToCheck = [parentRoleName];
        while (rolesToCheck.length !== 0) {
          const roleName = rolesToCheck.pop();
          if (roleName === childRoleName) {
            return true;
          }
          const role = Promise.await(Meteor.roles.findOneAsync({
            _id: roleName
          }));

          // This should not happen, but this is a problem to address at some other time.
          if (!role) continue;
          rolesToCheck = rolesToCheck.concat(role.children.map(r => r._id));
        }
        return false;
      });
    },
    /**
     * Normalize options.
     *
     * @method _normalizeOptions
     * @param {Object} options Options to normalize.
     * @return {Object} Normalized options.
     * @private
     * @static
     */
    _normalizeOptions: function (options) {
      options = options === undefined ? {} : options;
      if (options === null || typeof options === 'string') {
        options = {
          scope: options
        };
      }
      options.scope = Roles._normalizeScopeName(options.scope);
      return options;
    },
    /**
     * Normalize scope name.
     *
     * @method _normalizeScopeName
     * @param {String} scopeName A scope name to normalize.
     * @return {String} Normalized scope name.
     * @private
     * @static
     */
    _normalizeScopeName: function (scopeName) {
      // map undefined and null to null
      if (scopeName == null) {
        return null;
      } else {
        return scopeName;
      }
    },
    /**
     * Throw an exception if `scopeName` is an invalid scope name.
     *
     * @method _checkRoleName
     * @param {String} scopeName A scope name to match against.
     * @private
     * @static
     */
    _checkScopeName: function (scopeName) {
      if (scopeName === null) return;
      if (!scopeName || typeof scopeName !== 'string' || scopeName.trim() !== scopeName) {
        throw new Error("Invalid scope name '" + scopeName + "'.");
      }
    }
  });
}.call(this, module);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"roles_server.js":function module(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/alanning_roles/roles/roles_server.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global Meteor, Roles */
let indexFnAssignment;
let indexFnRoles;
if (Meteor.roles.createIndexAsync) {
  indexFnAssignment = Meteor.roleAssignment.createIndexAsync.bind(Meteor.roleAssignment);
  indexFnRoles = Meteor.roles.createIndexAsync.bind(Meteor.roles);
} else if (Meteor.roles.createIndex) {
  indexFnAssignment = Meteor.roleAssignment.createIndex.bind(Meteor.roleAssignment);
  indexFnRoles = Meteor.roles.createIndex.bind(Meteor.roles);
} else {
  indexFnAssignment = Meteor.roleAssignment._ensureIndex.bind(Meteor.roleAssignment);
  indexFnRoles = Meteor.roles._ensureIndex.bind(Meteor.roles);
}
[{
  'user._id': 1,
  'inheritedRoles._id': 1,
  scope: 1
}, {
  'user._id': 1,
  'role._id': 1,
  scope: 1
}, {
  'role._id': 1
}, {
  scope: 1,
  'user._id': 1,
  'inheritedRoles._id': 1
},
// Adding userId and roleId might speed up other queries depending on the first index
{
  'inheritedRoles._id': 1
}].forEach(index => indexFnAssignment(index));
indexFnRoles({
  'children._id': 1
});

/*
 * Publish logged-in user's roles so client-side checks can work.
 *
 * Use a named publish function so clients can check `ready()` state.
 */
Meteor.publish('_roles', function () {
  const loggedInUserId = this.userId;
  const fields = {
    roles: 1
  };
  if (!loggedInUserId) {
    this.ready();
    return;
  }
  return Meteor.users.find({
    _id: loggedInUserId
  }, {
    fields
  });
});
Object.assign(Roles, {
  /**
   * @method _isNewRole
   * @param {Object} role `Meteor.roles` document.
   * @return {Boolean} Returns `true` if the `role` is in the new format.
   *                   If it is ambiguous or it is not, returns `false`.
   * @for Roles
   * @private
   * @static
   */
  _isNewRole: function (role) {
    return !('name' in role) && 'children' in role;
  },
  /**
   * @method _isOldRole
   * @param {Object} role `Meteor.roles` document.
   * @return {Boolean} Returns `true` if the `role` is in the old format.
   *                   If it is ambiguous or it is not, returns `false`.
   * @for Roles
   * @private
   * @static
   */
  _isOldRole: function (role) {
    return 'name' in role && !('children' in role);
  },
  /**
   * @method _isNewField
   * @param {Array} roles `Meteor.users` document `roles` field.
   * @return {Boolean} Returns `true` if the `roles` field is in the new format.
   *                   If it is ambiguous or it is not, returns `false`.
   * @for Roles
   * @private
   * @static
   */
  _isNewField: function (roles) {
    return Array.isArray(roles) && typeof roles[0] === 'object';
  },
  /**
   * @method _isOldField
   * @param {Array} roles `Meteor.users` document `roles` field.
   * @return {Boolean} Returns `true` if the `roles` field is in the old format.
   *                   If it is ambiguous or it is not, returns `false`.
   * @for Roles
   * @private
   * @static
   */
  _isOldField: function (roles) {
    return Array.isArray(roles) && typeof roles[0] === 'string' || typeof roles === 'object' && !Array.isArray(roles);
  },
  /**
   * @method _convertToNewRole
   * @param {Object} oldRole `Meteor.roles` document.
   * @return {Object} Converted `role` to the new format.
   * @for Roles
   * @private
   * @static
   */
  _convertToNewRole: function (oldRole) {
    if (!(typeof oldRole.name === 'string')) {
      throw new Error("Role name '" + oldRole.name + "' is not a string.");
    }
    return {
      _id: oldRole.name,
      children: []
    };
  },
  /**
   * @method _convertToOldRole
   * @param {Object} newRole `Meteor.roles` document.
   * @return {Object} Converted `role` to the old format.
   * @for Roles
   * @private
   * @static
   */
  _convertToOldRole: function (newRole) {
    if (!(typeof newRole._id === 'string')) {
      throw new Error("Role name '" + newRole._id + "' is not a string.");
    }
    return {
      name: newRole._id
    };
  },
  /**
   * @method _convertToNewField
   * @param {Array} oldRoles `Meteor.users` document `roles` field in the old format.
   * @param {Boolean} convertUnderscoresToDots Should we convert underscores to dots in group names.
   * @return {Array} Converted `roles` to the new format.
   * @for Roles
   * @private
   * @static
   */
  _convertToNewField: function (oldRoles, convertUnderscoresToDots) {
    const roles = [];
    if (Array.isArray(oldRoles)) {
      oldRoles.forEach(function (role, index) {
        if (!(typeof role === 'string')) {
          throw new Error("Role '" + role + "' is not a string.");
        }
        roles.push({
          _id: role,
          scope: null,
          assigned: true
        });
      });
    } else if (typeof oldRoles === 'object') {
      Object.entries(oldRoles).forEach(_ref => {
        let [group, rolesArray] = _ref;
        if (group === '__global_roles__') {
          group = null;
        } else if (convertUnderscoresToDots) {
          // unescape
          group = group.replace(/_/g, '.');
        }
        rolesArray.forEach(function (role) {
          if (!(typeof role === 'string')) {
            throw new Error("Role '" + role + "' is not a string.");
          }
          roles.push({
            _id: role,
            scope: group,
            assigned: true
          });
        });
      });
    }
    return roles;
  },
  /**
   * @method _convertToOldField
   * @param {Array} newRoles `Meteor.users` document `roles` field in the new format.
   * @param {Boolean} usingGroups Should we use groups or not.
   * @return {Array} Converted `roles` to the old format.
   * @for Roles
   * @private
   * @static
   */
  _convertToOldField: function (newRoles, usingGroups) {
    let roles;
    if (usingGroups) {
      roles = {};
    } else {
      roles = [];
    }
    newRoles.forEach(function (userRole) {
      if (!(typeof userRole === 'object')) {
        throw new Error("Role '" + userRole + "' is not an object.");
      }

      // We assume that we are converting back a failed migration, so values can only be
      // what were valid values in 1.0. So no group names starting with $ and no subroles.

      if (userRole.scope) {
        if (!usingGroups) {
          throw new Error("Role '" + userRole._id + "' with scope '" + userRole.scope + "' without enabled groups.");
        }

        // escape
        const scope = userRole.scope.replace(/\./g, '_');
        if (scope[0] === '$') {
          throw new Error("Group name '" + scope + "' start with $.");
        }
        roles[scope] = roles[scope] || [];
        roles[scope].push(userRole._id);
      } else {
        if (usingGroups) {
          roles.__global_roles__ = roles.__global_roles__ || [];
          roles.__global_roles__.push(userRole._id);
        } else {
          roles.push(userRole._id);
        }
      }
    });
    return roles;
  },
  /**
   * @method _defaultUpdateUser
   * @param {Object} user `Meteor.users` document.
   * @param {Array|Object} roles Value to which user's `roles` field should be set.
   * @for Roles
   * @private
   * @static
   */
  _defaultUpdateUser: function (user, roles) {
    Meteor.users.update({
      _id: user._id,
      // making sure nothing changed in meantime
      roles: user.roles
    }, {
      $set: {
        roles
      }
    });
  },
  /**
   * @method _defaultUpdateRole
   * @param {Object} oldRole Old `Meteor.roles` document.
   * @param {Object} newRole New `Meteor.roles` document.
   * @for Roles
   * @private
   * @static
   */
  _defaultUpdateRole: function (oldRole, newRole) {
    Meteor.roles.remove(oldRole._id);
    Meteor.roles.insert(newRole);
  },
  /**
   * @method _dropCollectionIndex
   * @param {Object} collection Collection on which to drop the index.
   * @param {String} indexName Name of the index to drop.
   * @for Roles
   * @private
   * @static
   */
  _dropCollectionIndex: function (collection, indexName) {
    try {
      collection._dropIndex(indexName);
    } catch (e) {
      const indexNotFound = /index not found/.test(e.message || e.err || e.errmsg);
      if (!indexNotFound) {
        throw e;
      }
    }
  },
  /**
   * Migrates `Meteor.users` and `Meteor.roles` to the new format.
   *
   * @method _forwardMigrate
   * @param {Function} updateUser Function which updates the user object. Default `_defaultUpdateUser`.
   * @param {Function} updateRole Function which updates the role object. Default `_defaultUpdateRole`.
   * @param {Boolean} convertUnderscoresToDots Should we convert underscores to dots in group names.
   * @for Roles
   * @private
   * @static
   */
  _forwardMigrate: function (updateUser, updateRole, convertUnderscoresToDots) {
    updateUser = updateUser || Roles._defaultUpdateUser;
    updateRole = updateRole || Roles._defaultUpdateRole;
    Roles._dropCollectionIndex(Meteor.roles, 'name_1');
    Meteor.roles.find().forEach(function (role, index, cursor) {
      if (!Roles._isNewRole(role)) {
        updateRole(role, Roles._convertToNewRole(role));
      }
    });
    Meteor.users.find().forEach(function (user, index, cursor) {
      if (!Roles._isNewField(user.roles)) {
        updateUser(user, Roles._convertToNewField(user.roles, convertUnderscoresToDots));
      }
    });
  },
  /**
   * Moves the assignments from `Meteor.users` to `Meteor.roleAssignment`.
   *
   * @method _forwardMigrate2
   * @param {Object} userSelector An opportunity to share the work among instances. It's advisable to do the division based on user-id.
   * @for Roles
   * @private
   * @static
   */
  _forwardMigrate2: function (userSelector) {
    userSelector = userSelector || {};
    Object.assign(userSelector, {
      roles: {
        $ne: null
      }
    });
    Meteor.users.find(userSelector).forEach(function (user, index) {
      user.roles.filter(r => r.assigned).forEach(r => {
        // Added `ifExists` to make it less error-prone
        Roles._addUserToRole(user._id, r._id, {
          scope: r.scope,
          ifExists: true
        });
      });
      Meteor.users.update({
        _id: user._id
      }, {
        $unset: {
          roles: ''
        }
      });
    });

    // No need to keep the indexes around
    Roles._dropCollectionIndex(Meteor.users, 'roles._id_1_roles.scope_1');
    Roles._dropCollectionIndex(Meteor.users, 'roles.scope_1');
  },
  /**
   * Migrates `Meteor.users` and `Meteor.roles` to the old format.
   *
   * We assume that we are converting back a failed migration, so values can only be
   * what were valid values in the old format. So no group names starting with `$` and
   * no subroles.
   *
   * @method _backwardMigrate
   * @param {Function} updateUser Function which updates the user object. Default `_defaultUpdateUser`.
   * @param {Function} updateRole Function which updates the role object. Default `_defaultUpdateRole`.
   * @param {Boolean} usingGroups Should we use groups or not.
   * @for Roles
   * @private
   * @static
   */
  _backwardMigrate: function (updateUser, updateRole, usingGroups) {
    updateUser = updateUser || Roles._defaultUpdateUser;
    updateRole = updateRole || Roles._defaultUpdateRole;
    Roles._dropCollectionIndex(Meteor.users, 'roles._id_1_roles.scope_1');
    Roles._dropCollectionIndex(Meteor.users, 'roles.scope_1');
    Meteor.roles.find().forEach(function (role, index, cursor) {
      if (!Roles._isOldRole(role)) {
        updateRole(role, Roles._convertToOldRole(role));
      }
    });
    Meteor.users.find().forEach(function (user, index, cursor) {
      if (!Roles._isOldField(user.roles)) {
        updateUser(user, Roles._convertToOldField(user.roles, usingGroups));
      }
    });
  },
  /**
   * Moves the assignments from `Meteor.roleAssignment` back to to `Meteor.users`.
   *
   * @method _backwardMigrate2
   * @param {Object} assignmentSelector An opportunity to share the work among instances. It's advisable to do the division based on user-id.
   * @for Roles
   * @private
   * @static
   */
  _backwardMigrate2: function (assignmentSelector) {
    assignmentSelector = assignmentSelector || {};
    if (Meteor.users.createIndex) {
      Meteor.users.createIndex({
        'roles._id': 1,
        'roles.scope': 1
      });
      Meteor.users.createIndex({
        'roles.scope': 1
      });
    } else {
      Meteor.users._ensureIndex({
        'roles._id': 1,
        'roles.scope': 1
      });
      Meteor.users._ensureIndex({
        'roles.scope': 1
      });
    }
    Meteor.roleAssignment.find(assignmentSelector).forEach(r => {
      const roles = Meteor.users.findOne({
        _id: r.user._id
      }).roles || [];
      const currentRole = roles.find(oldRole => oldRole._id === r.role._id && oldRole.scope === r.scope);
      if (currentRole) {
        currentRole.assigned = true;
      } else {
        roles.push({
          _id: r.role._id,
          scope: r.scope,
          assigned: true
        });
        r.inheritedRoles.forEach(inheritedRole => {
          const currentInheritedRole = roles.find(oldRole => oldRole._id === inheritedRole._id && oldRole.scope === r.scope);
          if (!currentInheritedRole) {
            roles.push({
              _id: inheritedRole._id,
              scope: r.scope,
              assigned: false
            });
          }
        });
      }
      Meteor.users.update({
        _id: r.user._id
      }, {
        $set: {
          roles
        }
      });
      Meteor.roleAssignment.remove({
        _id: r._id
      });
    });
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json",
    ".d.ts"
  ]
});

require("/node_modules/meteor/alanning:roles/roles/roles_common.js");
require("/node_modules/meteor/alanning:roles/roles/roles_common_async.js");
require("/node_modules/meteor/alanning:roles/roles/roles_server.js");

/* Exports */
Package._define("alanning:roles", {
  Roles: Roles
});

})();

//# sourceURL=meteor://💻app/packages/alanning_roles.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYWxhbm5pbmc6cm9sZXMvcm9sZXMvcm9sZXNfY29tbW9uLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9hbGFubmluZzpyb2xlcy9yb2xlcy9yb2xlc19jb21tb25fYXN5bmMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2FsYW5uaW5nOnJvbGVzL3JvbGVzL3JvbGVzX3NlcnZlci5qcyJdLCJuYW1lcyI6WyJNZXRlb3IiLCJyb2xlcyIsIk1vbmdvIiwiQ29sbGVjdGlvbiIsInJvbGVBc3NpZ25tZW50IiwiUm9sZXMiLCJnZXRHcm91cHNGb3JVc2VyRGVwcmVjYXRpb25XYXJuaW5nIiwiT2JqZWN0IiwiYXNzaWduIiwiR0xPQkFMX0dST1VQIiwiY3JlYXRlUm9sZSIsInJvbGVOYW1lIiwib3B0aW9ucyIsIl9jaGVja1JvbGVOYW1lIiwidW5sZXNzRXhpc3RzIiwicmVzdWx0IiwidXBzZXJ0IiwiX2lkIiwiJHNldE9uSW5zZXJ0IiwiY2hpbGRyZW4iLCJpbnNlcnRlZElkIiwiRXJyb3IiLCJkZWxldGVSb2xlIiwiaW5oZXJpdGVkUm9sZXMiLCJyZW1vdmUiLCJfZ2V0UGFyZW50Um9sZU5hbWVzIiwiZmluZE9uZSIsImZpbmQiLCIkaW4iLCJmZXRjaCIsImZvckVhY2giLCJyIiwidXBkYXRlIiwiJHB1bGwiLCJfZ2V0SW5oZXJpdGVkUm9sZU5hbWVzIiwiJHNldCIsIm1hcCIsInIyIiwibXVsdGkiLCJsZW5ndGgiLCJyZW5hbWVSb2xlIiwib2xkTmFtZSIsIm5ld05hbWUiLCJjb3VudCIsInJvbGUiLCJpbnNlcnQiLCJhZGRSb2xlc1RvUGFyZW50Iiwicm9sZXNOYW1lcyIsInBhcmVudE5hbWUiLCJBcnJheSIsImlzQXJyYXkiLCJfYWRkUm9sZVRvUGFyZW50IiwiaW5jbHVkZXMiLCIkbmUiLCIkcHVzaCIsIiRlYWNoIiwicmVtb3ZlUm9sZXNGcm9tUGFyZW50IiwiX3JlbW92ZVJvbGVGcm9tUGFyZW50IiwiZmllbGRzIiwiYWRkVXNlcnNUb1JvbGVzIiwidXNlcnMiLCJpZCIsIl9ub3JtYWxpemVPcHRpb25zIiwiX2NoZWNrU2NvcGVOYW1lIiwic2NvcGUiLCJpZkV4aXN0cyIsInVzZXIiLCJfYWRkVXNlclRvUm9sZSIsInNldFVzZXJSb2xlcyIsImFueVNjb3BlIiwic2VsZWN0b3IiLCJ1c2VySWQiLCJyZXMiLCJwYXJlbnRSb2xlcyIsIlNldCIsInBhcmVudFJvbGUiLCJhZGQiLCJkZWxldGUiLCJuZXN0ZWRSb2xlcyIsInJlbW92ZVVzZXJzRnJvbVJvbGVzIiwiX3JlbW92ZVVzZXJGcm9tUm9sZSIsInVzZXJJc0luUm9sZSIsImZpbHRlciIsInNvbWUiLCJsaW1pdCIsImdldFJvbGVzRm9yVXNlciIsImZ1bGxPYmplY3RzIiwib25seUFzc2lnbmVkIiwib25seVNjb3BlZCIsInB1c2giLCJyZWR1Y2UiLCJyZXYiLCJjdXJyZW50IiwiY29uY2F0IiwiZ2V0QWxsUm9sZXMiLCJxdWVyeU9wdGlvbnMiLCJzb3J0IiwiZ2V0VXNlcnNJblJvbGUiLCJpZHMiLCJnZXRVc2VyQXNzaWdubWVudHNGb3JSb2xlIiwiYSIsIl9nZXRVc2Vyc0luUm9sZUN1cnNvciIsImdldEdyb3Vwc0ZvclVzZXIiLCJjb25zb2xlIiwid2FybiIsImdldFNjb3Blc0ZvclVzZXIiLCJhcmd1bWVudHMiLCJzY29wZXMiLCJvYmkiLCJyZW5hbWVTY29wZSIsInJlbW92ZVNjb3BlIiwibmFtZSIsInRyaW0iLCJpc1BhcmVudE9mIiwicGFyZW50Um9sZU5hbWUiLCJjaGlsZFJvbGVOYW1lIiwicm9sZXNUb0NoZWNrIiwicG9wIiwidW5kZWZpbmVkIiwiX25vcm1hbGl6ZVNjb3BlTmFtZSIsInNjb3BlTmFtZSIsImNhbGwiLCJtb2R1bGUiLCJtb2R1bGUxIiwibGluayIsInYiLCJhc3luY1NvbWUiLCJhcnIiLCJwcmVkaWNhdGUiLCJQcm9taXNlIiwiYXN5bmNBcHBseSIsImUiLCJhd2FpdCIsImNyZWF0ZVJvbGVBc3luYyIsImV4aXN0aW5nUm9sZSIsImZpbmRPbmVBc3luYyIsInVwZGF0ZUFzeW5jIiwiaW5zZXJ0QXN5bmMiLCJkZWxldGVSb2xlQXN5bmMiLCJyZW1vdmVBc3luYyIsImZldGNoQXN5bmMiLCJfZ2V0SW5oZXJpdGVkUm9sZU5hbWVzQXN5bmMiLCJyZW5hbWVSb2xlQXN5bmMiLCJhZGRSb2xlc1RvUGFyZW50QXN5bmMiLCJfYWRkUm9sZVRvUGFyZW50QXN5bmMiLCJyZW1vdmVSb2xlc0Zyb21QYXJlbnRBc3luYyIsIl9yZW1vdmVSb2xlRnJvbVBhcmVudEFzeW5jIiwiX2dldFBhcmVudFJvbGVOYW1lc0FzeW5jIiwiYWRkVXNlcnNUb1JvbGVzQXN5bmMiLCJfYWRkVXNlclRvUm9sZUFzeW5jIiwic2V0VXNlclJvbGVzQXN5bmMiLCJleGlzdGluZ0Fzc2lnbm1lbnQiLCJyZW1vdmVVc2Vyc0Zyb21Sb2xlc0FzeW5jIiwiX3JlbW92ZVVzZXJGcm9tUm9sZUFzeW5jIiwidXNlcklzSW5Sb2xlQXN5bmMiLCJvdXQiLCJjb3VudEFzeW5jIiwiZ2V0Um9sZXNGb3JVc2VyQXN5bmMiLCJnZXRVc2Vyc0luUm9sZUFzeW5jIiwiZ2V0R3JvdXBzRm9yVXNlckFzeW5jIiwiZ2V0U2NvcGVzRm9yVXNlckFzeW5jIiwicmVuYW1lU2NvcGVBc3luYyIsInJlbW92ZVNjb3BlQXN5bmMiLCJpc1BhcmVudE9mQXN5bmMiLCJpbmRleEZuQXNzaWdubWVudCIsImluZGV4Rm5Sb2xlcyIsImNyZWF0ZUluZGV4QXN5bmMiLCJiaW5kIiwiY3JlYXRlSW5kZXgiLCJfZW5zdXJlSW5kZXgiLCJpbmRleCIsInB1Ymxpc2giLCJsb2dnZWRJblVzZXJJZCIsInJlYWR5IiwiX2lzTmV3Um9sZSIsIl9pc09sZFJvbGUiLCJfaXNOZXdGaWVsZCIsIl9pc09sZEZpZWxkIiwiX2NvbnZlcnRUb05ld1JvbGUiLCJvbGRSb2xlIiwiX2NvbnZlcnRUb09sZFJvbGUiLCJuZXdSb2xlIiwiX2NvbnZlcnRUb05ld0ZpZWxkIiwib2xkUm9sZXMiLCJjb252ZXJ0VW5kZXJzY29yZXNUb0RvdHMiLCJhc3NpZ25lZCIsImVudHJpZXMiLCJfcmVmIiwiZ3JvdXAiLCJyb2xlc0FycmF5IiwicmVwbGFjZSIsIl9jb252ZXJ0VG9PbGRGaWVsZCIsIm5ld1JvbGVzIiwidXNpbmdHcm91cHMiLCJ1c2VyUm9sZSIsIl9fZ2xvYmFsX3JvbGVzX18iLCJfZGVmYXVsdFVwZGF0ZVVzZXIiLCJfZGVmYXVsdFVwZGF0ZVJvbGUiLCJfZHJvcENvbGxlY3Rpb25JbmRleCIsImNvbGxlY3Rpb24iLCJpbmRleE5hbWUiLCJfZHJvcEluZGV4IiwiaW5kZXhOb3RGb3VuZCIsInRlc3QiLCJtZXNzYWdlIiwiZXJyIiwiZXJybXNnIiwiX2ZvcndhcmRNaWdyYXRlIiwidXBkYXRlVXNlciIsInVwZGF0ZVJvbGUiLCJjdXJzb3IiLCJfZm9yd2FyZE1pZ3JhdGUyIiwidXNlclNlbGVjdG9yIiwiJHVuc2V0IiwiX2JhY2t3YXJkTWlncmF0ZSIsIl9iYWNrd2FyZE1pZ3JhdGUyIiwiYXNzaWdubWVudFNlbGVjdG9yIiwiY3VycmVudFJvbGUiLCJpbmhlcml0ZWRSb2xlIiwiY3VycmVudEluaGVyaXRlZFJvbGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0VBQUE7O0VBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0EsSUFBSSxDQUFDQSxNQUFNLENBQUNDLEtBQUssRUFBRTtJQUNqQkQsTUFBTSxDQUFDQyxLQUFLLEdBQUcsSUFBSUMsS0FBSyxDQUFDQyxVQUFVLENBQUMsT0FBTyxDQUFDO0VBQzlDO0VBRUEsSUFBSSxDQUFDSCxNQUFNLENBQUNJLGNBQWMsRUFBRTtJQUMxQkosTUFBTSxDQUFDSSxjQUFjLEdBQUcsSUFBSUYsS0FBSyxDQUFDQyxVQUFVLENBQUMsaUJBQWlCLENBQUM7RUFDakU7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MUosQ0FBQyxDQUFDUixjQUFjLENBQUNPLE9BQU8sQ0FBRTRMLGFBQWEsSUFBSztVQUMxQyxNQUFNQyxvQkFBb0IsR0FBRzFOLEtBQUssQ0FBQzBCLElBQUksQ0FDcEN3SixPQUFPLElBQ05BLE9BQU8sQ0FBQ2xLLEdBQUcsS0FBS3lNLGFBQWEsQ0FBQ3pNLEdBQUcsSUFBSWtLLE9BQU8sQ0FBQ25ILEtBQUssS0FBS2pDLENBQUMsQ0FBQ2lDLEtBQzdELENBQUM7VUFFRCxJQUFJLENBQUMySixvQkFBb0IsRUFBRTtZQUN6QjFOLEtBQUssQ0FBQ3dGLElBQUksQ0FBQztjQUNUeEUsR0FBRyxFQUFFeU0sYUFBYSxDQUFDek0sR0FBRztjQUN0QitDLEtBQUssRUFBRWpDLENBQUMsQ0FBQ2lDLEtBQUs7Y0FDZHlILFFBQVEsRUFBRTtZQUNaLENBQUMsQ0FBQztVQUNKO1FBQ0YsQ0FBQyxDQUFDO01BQ0o7TUFFQXpMLE1BQU0sQ0FBQzRELEtBQUssQ0FBQzVCLE1BQU0sQ0FBQztRQUFFZixHQUFHLEVBQUVjLENBQUMsQ0FBQ21DLElBQUksQ0FBQ2pEO01BQUksQ0FBQyxFQUFFO1FBQUVrQixJQUFJLEVBQUU7VUFBRWxDO1FBQU07TUFBRSxDQUFDLENBQUM7TUFDN0RELE1BQU0sQ0FBQ0ksY0FBYyxDQUFDb0IsTUFBTSxDQUFDO1FBQUVQLEdBQUcsRUFBRWMsQ0FBQyxDQUFDZDtNQUFJLENBQUMsQ0FBQztJQUM5QyxDQUFDLENBQUM7RUFDSjtBQUNGLENBQUMsQ0FBQyxDIiwiZmlsZSI6Ii9wYWNrYWdlcy9hbGFubmluZ19yb2xlcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGdsb2JhbCBNZXRlb3IsIFJvbGVzLCBNb25nbyAqL1xuXG4vKipcbiAqIFByb3ZpZGVzIGZ1bmN0aW9ucyByZWxhdGVkIHRvIHVzZXIgYXV0aG9yaXphdGlvbi4gQ29tcGF0aWJsZSB3aXRoIGJ1aWx0LWluIE1ldGVvciBhY2NvdW50cyBwYWNrYWdlcy5cbiAqXG4gKiBSb2xlcyBhcmUgYWNjZXNzaWJsZSB0aHJvZ2ggYE1ldGVvci5yb2xlc2AgY29sbGVjdGlvbiBhbmQgZG9jdW1lbnRzIGNvbnNpc3Qgb2Y6XG4gKiAgLSBgX2lkYDogcm9sZSBuYW1lXG4gKiAgLSBgY2hpbGRyZW5gOiBsaXN0IG9mIHN1YmRvY3VtZW50czpcbiAqICAgIC0gYF9pZGBcbiAqXG4gKiBDaGlsZHJlbiBsaXN0IGVsZW1lbnRzIGFyZSBzdWJkb2N1bWVudHMgc28gdGhhdCB0aGV5IGNhbiBiZSBlYXNpZXIgZXh0ZW5kZWQgaW4gdGhlIGZ1dHVyZSBvciBieSBwbHVnaW5zLlxuICpcbiAqIFJvbGVzIGNhbiBoYXZlIG11bHRpcGxlIHBhcmVudHMgYW5kIGNhbiBiZSBjaGlsZHJlbiAoc3Vicm9sZXMpIG9mIG11bHRpcGxlIHJvbGVzLlxuICpcbiAqIEV4YW1wbGU6IGB7X2lkOiAnYWRtaW4nLCBjaGlsZHJlbjogW3tfaWQ6ICdlZGl0b3InfV19YFxuICpcbiAqIFRoZSBhc3NpZ25tZW50IG9mIGEgcm9sZSB0byBhIHVzZXIgaXMgc3RvcmVkIGluIGEgY29sbGVjdGlvbiwgYWNjZXNzaWJsZSB0aHJvdWdoIGBNZXRlb3Iucm9sZUFzc2lnbm1lbnRgLlxuICogSXQncyBkb2N1bWVudHMgY29uc2lzdCBvZlxuICogIC0gYF9pZGA6IEludGVybmFsIE1vbmdvREIgaWRcbiAqICAtIGByb2xlYDogQSByb2xlIG9iamVjdCB3aGljaCBnb3QgYXNzaWduZWQuIFVzdWFsbHkgb25seSBjb250YWlucyB0aGUgYF9pZGAgcHJvcGVydHlcbiAqICAtIGB1c2VyYDogQSB1c2VyIG9iamVjdCwgdXN1YWxseSBvbmx5IGNvbnRhaW5zIHRoZSBgX2lkYCBwcm9wZXJ0eVxuICogIC0gYHNjb3BlYDogc2NvcGUgbmFtZVxuICogIC0gYGluaGVyaXRlZFJvbGVzYDogQSBsaXN0IG9mIGFsbCB0aGUgcm9sZXMgb2JqZWN0cyBpbmhlcml0ZWQgYnkgdGhlIGFzc2lnbmVkIHJvbGUuXG4gKlxuICogQG1vZHVsZSBSb2xlc1xuICovXG5pZiAoIU1ldGVvci5yb2xlcykge1xuICBNZXRlb3Iucm9sZXMgPSBuZXcgTW9uZ28uQ29sbGVjdGlvbigncm9sZXMnKVxufVxuXG5pZiAoIU1ldGVvci5yb2xlQXNzaWdubWVudCkge1xuICBNZXRlb3Iucm9sZUFzc2lnbm1lbnQgPSBuZXcgTW9uZ28uQ29sbGVjdGlvbigncm9sZS1hc3NpZ25tZW50Jylcbn1cblxuLyoqXG4gKiBAY2xhc3MgUm9sZXNcbiAqL1xuaWYgKHR5cGVvZiBSb2xlcyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgUm9sZXMgPSB7fSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWdsb2JhbC1hc3NpZ25cbn1cblxubGV0IGdldEdyb3Vwc0ZvclVzZXJEZXByZWNhdGlvbldhcm5pbmcgPSBmYWxzZVxuXG5PYmplY3QuYXNzaWduKFJvbGVzLCB7XG5cbiAgLyoqXG4gICAqIFVzZWQgYXMgYSBnbG9iYWwgZ3JvdXAgKG5vdyBzY29wZSkgbmFtZS4gTm90IHVzZWQgYW55bW9yZS5cbiAgICpcbiAgICogQHByb3BlcnR5IEdMT0JBTF9HUk9VUFxuICAgKiBAc3RhdGljXG4gICAqIEBkZXByZWNhdGVkXG4gICAqL1xuICBHTE9CQUxfR1JPVVA6IG51bGwsXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyByb2xlLlxuICAgKlxuICAgKiBAbWV0aG9kIGNyZWF0ZVJvbGVcbiAgICogQHBhcmFtIHtTdHJpbmd9IHJvbGVOYW1lIE5hbWUgb2Ygcm9sZS5cbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBPcHRpb25zOlxuICAgKiAgIC0gYHVubGVzc0V4aXN0c2A6IGlmIGB0cnVlYCwgZXhjZXB0aW9uIHdpbGwgbm90IGJlIHRocm93biBpbiB0aGUgcm9sZSBhbHJlYWR5IGV4aXN0c1xuICAgKiBAcmV0dXJuIHtTdHJpbmd9IElEIG9mIHRoZSBuZXcgcm9sZSBvciBudWxsLlxuICAgKiBAc3RhdGljXG4gICAqL1xuICBjcmVhdGVSb2xlOiBmdW5jdGlvbiAocm9sZU5hbWUsIG9wdGlvbnMpIHtcbiAgICBSb2xlcy5fY2hlY2tSb2xlTmFtZShyb2xlTmFtZSlcblxuICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIHVubGVzc0V4aXN0czogZmFsc2VcbiAgICB9LCBvcHRpb25zKVxuXG4gICAgY29uc3QgcmVzdWx0ID0gTWV0ZW9yLnJvbGVzLnVwc2VydCh7IF9pZDogcm9sZU5hbWUgfSwgeyAkc2V0T25JbnNlcnQ6IHsgY2hpbGRyZW46IFtdIH0gfSlcblxuICAgIGlmICghcmVzdWx0Lmluc2VydGVkSWQpIHtcbiAgICAgIGlmIChvcHRpb25zLnVubGVzc0V4aXN0cykgcmV0dXJuIG51bGxcbiAgICAgIHRocm93IG5ldyBFcnJvcignUm9sZSBcXCcnICsgcm9sZU5hbWUgKyAnXFwnIGFscmVhZHkgZXhpc3RzLicpXG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdC5pbnNlcnRlZElkXG4gIH0sXG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBJZiB0aGUgcm9sZSBpcyBzZXQgZm9yIGFueSB1c2VyLCBpdCBpcyBhdXRvbWF0aWNhbGx5IHVuc2V0LlxuICAgKlxuICAgKiBAbWV0aG9kIGRlbGV0ZVJvbGVcbiAgICogQHBhcmFtIHtTdHJpbmd9IHJvbGVOYW1lIE5hbWUgb2Ygcm9sZS5cbiAgICogQHN0YXRpY1xuICAgKi9cbiAgZGVsZXRlUm9sZTogZnVuY3Rpb24gKHJvbGVOYW1lKSB7XG4gICAgbGV0IHJvbGVzXG4gICAgbGV0IGluaGVyaXRlZFJvbGVzXG5cbiAgICBSb2xlcy5fY2hlY2tSb2xlTmFtZShyb2xlTmFtZSlcblxuICAgIC8vIFJlbW92ZSBhbGwgYXNzaWdubWVudHNcbiAgICBNZXRlb3Iucm9sZUFzc2lnbm1lbnQucmVtb3ZlKHtcbiAgICAgICdyb2xlLl9pZCc6IHJvbGVOYW1lXG4gICAgfSlcblxuICAgIGRvIHtcbiAgICAgIC8vIEZvciBhbGwgcm9sZXMgd2hvIGhhdmUgaXQgYXMgYSBkZXBlbmRlbmN5IC4uLlxuICAgICAgcm9sZXMgPSBSb2xlcy5fZ2V0UGFyZW50Um9sZU5hbWVzKE1ldGVvci5yb2xlcy5maW5kT25lKHsgX2lkOiByb2xlTmFtZSB9KSlcblxuICAgICAgTWV0ZW9yLnJvbGVzLmZpbmQoeyBfaWQ6IHsgJGluOiByb2xlcyB9IH0pLmZldGNoKCkuZm9yRWFjaChyID0+IHtcbiAgICAgICAgTWV0ZW9yLnJvbGVzLnVwZGF0ZSh7XG4gICAgICAgICAgX2lkOiByLl9pZFxuICAgICAgICB9LCB7XG4gICAgICAgICAgJHB1bGw6IHtcbiAgICAgICAgICAgIGNoaWxkcmVuOiB7XG4gICAgICAgICAgICAgIF9pZDogcm9sZU5hbWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgaW5oZXJpdGVkUm9sZXMgPSBSb2xlcy5fZ2V0SW5oZXJpdGVkUm9sZU5hbWVzKE1ldGVvci5yb2xlcy5maW5kT25lKHsgX2lkOiByLl9pZCB9KSlcbiAgICAgICAgTWV0ZW9yLnJvbGVBc3NpZ25tZW50LnVwZGF0ZSh7XG4gICAgICAgICAgJ3JvbGUuX2lkJzogci5faWRcbiAgICAgICAgfSwge1xuICAgICAgICAgICRzZXQ6IHtcbiAgICAgICAgICAgIGluaGVyaXRlZFJvbGVzOiBbci5faWQsIC4uLmluaGVyaXRlZFJvbGVzXS5tYXAocjIgPT4gKHsgX2lkOiByMiB9KSlcbiAgICAgICAgICB9XG4gICAgICAgIH0sIHsgbXVsdGk6IHRydWUgfSlcbiAgICAgIH0pXG4gICAgfSB3aGlsZSAocm9sZXMubGVuZ3RoID4gMClcblxuICAgIC8vIEFuZCBmaW5hbGx5IHJlbW92ZSB0aGUgcm9sZSBpdHNlbGZcbiAgICBNZXRlb3Iucm9sZXMucmVtb3ZlKHsgX2lkOiByb2xlTmFtZSB9KVxuICB9LFxuXG4gIC8qKlxuICAgKiBSZW5hbWUgYW4gZXhpc3Rpbmcgcm9sZS5cbiAgICpcbiAgICogQG1ldGhvZCByZW5hbWVSb2xlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBvbGROYW1lIE9sZCBuYW1lIG9mIGEgcm9sZS5cbiAgICogQHBhcmFtIHtTdHJpbmd9IG5ld05hbWUgTmV3IG5hbWUgb2YgYSByb2xlLlxuICAgKiBAc3RhdGljXG4gICAqL1xuICByZW5hbWVSb2xlOiBmdW5jdGlvbiAob2xkTmFtZSwgbmV3TmFtZSkge1xuICAgIGxldCBjb3VudFxuXG4gICAgUm9sZXMuX2NoZWNrUm9sZU5hbWUob2xkTmFtZSlcbiAgICBSb2xlcy5fY2hlY2tSb2xlTmFtZShuZXdOYW1lKVxuXG4gICAgaWYgKG9sZE5hbWUgPT09IG5ld05hbWUpIHJldHVyblxuXG4gICAgY29uc3Qgcm9sZSA9IE1ldGVvci5yb2xlcy5maW5kT25lKHsgX2lkOiBvbGROYW1lIH0pXG5cbiAgICBpZiAoIXJvbGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUm9sZSBcXCcnICsgb2xkTmFtZSArICdcXCcgZG9lcyBub3QgZXhpc3QuJylcbiAgICB9XG5cbiAgICByb2xlLl9pZCA9IG5ld05hbWVcblxuICAgIE1ldGVvci5yb2xlcy5pbnNlcnQocm9sZSlcblxuICAgIGRvIHtcbiAgICAgIGNvdW50ID0gTWV0ZW9yLnJvbGVBc3NpZ25tZW50LnVwZGF0ZSh7XG4gICAgICAgICdyb2xlLl9pZCc6IG9sZE5hbWVcbiAgICAgIH0sIHtcbiAgICAgICAgJHNldDoge1xuICAgICAgICAgICdyb2xlLl9pZCc6IG5ld05hbWVcbiAgICAgICAgfVxuICAgICAgfSwgeyBtdWx0aTogdHJ1ZSB9KVxuICAgIH0gd2hpbGUgKGNvdW50ID4gMClcblxuICAgIGRvIHtcbiAgICAgIGNvdW50ID0gTWV0ZW9yLnJvbGVBc3NpZ25tZW50LnVwZGF0ZSh7XG4gICAgICAgICdpbmhlcml0ZWRSb2xlcy5faWQnOiBvbGROYW1lXG4gICAgICB9LCB7XG4gICAgICAgICRzZXQ6IHtcbiAgICAgICAgICAnaW5oZXJpdGVkUm9sZXMuJC5faWQnOiBuZXdOYW1lXG4gICAgICAgIH1cbiAgICAgIH0sIHsgbXVsdGk6IHRydWUgfSlcbiAgICB9IHdoaWxlIChjb3VudCA+IDApXG5cbiAgICBkbyB7XG4gICAgICBjb3VudCA9IE1ldGVvci5yb2xlcy51cGRhdGUoe1xuICAgICAgICAnY2hpbGRyZW4uX2lkJzogb2xkTmFtZVxuICAgICAgfSwge1xuICAgICAgICAkc2V0OiB7XG4gICAgICAgICAgJ2NoaWxkcmVuLiQuX2lkJzogbmV3TmFtZVxuICAgICAgICB9XG4gICAgICB9LCB7IG11bHRpOiB0cnVlIH0pXG4gICAgfSB3aGlsZSAoY291bnQgPiAwKVxuXG4gICAgTWV0ZW9yLnJvbGVzLnJlbW92ZSh7IF9pZDogb2xkTmFtZSB9KVxuICB9LFxuXG4gIC8qKlxuICAgKiBBZGQgcm9sZSBwYXJlbnQgdG8gcm9sZXMuXG4gICAqXG4gICAqIFByZXZpb3VzIHBhcmVudHMgYXJlIGtlcHQgKHJvbGUgY2FuIGhhdmUgbXVsdGlwbGUgcGFyZW50cykuIEZvciB1c2VycyB3aGljaCBoYXZlIHRoZVxuICAgKiBwYXJlbnQgcm9sZSBzZXQsIG5ldyBzdWJyb2xlcyBhcmUgYWRkZWQgYXV0b21hdGljYWxseS5cbiAgICpcbiAgICogQG1ldGhvZCBhZGRSb2xlc1RvUGFyZW50XG4gICAqIEBwYXJhbSB7QXJyYXl8U3RyaW5nfSByb2xlc05hbWVzIE5hbWUocykgb2Ygcm9sZShzKS5cbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhcmVudE5hbWUgTmFtZSBvZiBwYXJlbnQgcm9sZS5cbiAgICogQHN0YXRpY1xuICAgKi9cbiAgYWRkUm9sZXNUb1BhcmVudDogZnVuY3Rpb24gKHJvbGVzTmFtZXMsIHBhcmVudE5hbWUpIHtcbiAgICAvLyBlbnN1cmUgYXJyYXlzXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHJvbGVzTmFtZXMpKSByb2xlc05hbWVzID0gW3JvbGVzTmFtZXNdXG5cbiAgICByb2xlc05hbWVzLmZvckVhY2goZnVuY3Rpb24gKHJvbGVOYW1lKSB7XG4gICAgICBSb2xlcy5fYWRkUm9sZVRvUGFyZW50KHJvbGVOYW1lLCBwYXJlbnROYW1lKVxuICAgIH0pXG4gIH0sXG5cbiAgLyoqXG4gICAqIEBtZXRob2QgX2FkZFJvbGVUb1BhcmVudFxuICAgKiBAcGFyYW0ge1N0cmluZ30gcm9sZU5hbWUgTmFtZSBvZiByb2xlLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGFyZW50TmFtZSBOYW1lIG9mIHBhcmVudCByb2xlLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAc3RhdGljXG4gICAqL1xuICBfYWRkUm9sZVRvUGFyZW50OiBmdW5jdGlvbiAocm9sZU5hbWUsIHBhcmVudE5hbWUpIHtcbiAgICBSb2xlcy5fY2hlY2tSb2xlTmFtZShyb2xlTmFtZSlcbiAgICBSb2xlcy5fY2hlY2tSb2xlTmFtZShwYXJlbnROYW1lKVxuXG4gICAgLy8gcXVlcnkgdG8gZ2V0IHJvbGUncyBjaGlsZHJlblxuICAgIGNvbnN0IHJvbGUgPSBNZXRlb3Iucm9sZXMuZmluZE9uZSh7IF9pZDogcm9sZU5hbWUgfSlcblxuICAgIGlmICghcm9sZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdSb2xlIFxcJycgKyByb2xlTmFtZSArICdcXCcgZG9lcyBub3QgZXhpc3QuJylcbiAgICB9XG5cbiAgICAvLyBkZXRlY3QgY3ljbGVzXG4gICAgaWYgKFJvbGVzLl9nZXRJbmhlcml0ZWRSb2xlTmFtZXMocm9sZSkuaW5jbHVkZXMocGFyZW50TmFtZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUm9sZXMgXFwnJyArIHJvbGVOYW1lICsgJ1xcJyBhbmQgXFwnJyArIHBhcmVudE5hbWUgKyAnXFwnIHdvdWxkIGZvcm0gYSBjeWNsZS4nKVxuICAgIH1cblxuICAgIGNvbnN0IGNvdW50ID0gTWV0ZW9yLnJvbGVzLnVwZGF0ZSh7XG4gICAgICBfaWQ6IHBhcmVudE5hbWUsXG4gICAgICAnY2hpbGRyZW4uX2lkJzoge1xuICAgICAgICAkbmU6IHJvbGUuX2lkXG4gICAgICB9XG4gICAgfSwge1xuICAgICAgJHB1c2g6IHtcbiAgICAgICAgY2hpbGRyZW46IHtcbiAgICAgICAgICBfaWQ6IHJvbGUuX2lkXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuXG4gICAgLy8gaWYgdGhlcmUgd2FzIG5vIGNoYW5nZSwgcGFyZW50IHJvbGUgbWlnaHQgbm90IGV4aXN0LCBvciByb2xlIGlzXG4gICAgLy8gYWxyZWFkeSBhIHN1YnJvbGU7IGluIGFueSBjYXNlIHdlIGRvIG5vdCBoYXZlIGFueXRoaW5nIG1vcmUgdG8gZG9cbiAgICBpZiAoIWNvdW50KSByZXR1cm5cblxuICAgIE1ldGVvci5yb2xlQXNzaWdubWVudC51cGRhdGUoe1xuICAgICAgJ2luaGVyaXRlZFJvbGVzLl9pZCc6IHBhcmVudE5hbWVcbiAgICB9LCB7XG4gICAgICAkcHVzaDoge1xuICAgICAgICBpbmhlcml0ZWRSb2xlczogeyAkZWFjaDogW3JvbGUuX2lkLCAuLi5Sb2xlcy5fZ2V0SW5oZXJpdGVkUm9sZU5hbWVzKHJvbGUpXS5tYXAociA9PiAoeyBfaWQ6IHIgfSkpIH1cbiAgICAgIH1cbiAgICB9LCB7IG11bHRpOiB0cnVlIH0pXG4gIH0sXG5cbiAgLyoqXG4gICAqIFJlbW92ZSByb2xlIHBhcmVudCBmcm9tIHJvbGVzLlxuICAgKlxuICAgKiBPdGhlciBwYXJlbnRzIGFyZSBrZXB0IChyb2xlIGNhbiBoYXZlIG11bHRpcGxlIHBhcmVudHMpLiBGb3IgdXNlcnMgd2hpY2ggaGF2ZSB0aGVcbiAgICogcGFyZW50IHJvbGUgc2V0LCByZW1vdmVkIHN1YnJvbGUgaXMgcmVtb3ZlZCBhdXRvbWF0aWNhbGx5LlxuICAgKlxuICAgKiBAbWV0aG9kIHJlbW92ZVJvbGVzRnJvbVBhcmVudFxuICAgKiBAcGFyYW0ge0FycmF5fFN0cmluZ30gcm9sZXNOYW1lcyBOYW1lKHMpIG9mIHJvbGUocykuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXJlbnROYW1lIE5hbWUgb2YgcGFyZW50IHJvbGUuXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIHJlbW92ZVJvbGVzRnJvbVBhcmVudDogZnVuY3Rpb24gKHJvbGVzTmFtZXMsIHBhcmVudE5hbWUpIHtcbiAgICAvLyBlbnN1cmUgYXJyYXlzXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHJvbGVzTmFtZXMpKSByb2xlc05hbWVzID0gW3JvbGVzTmFtZXNdXG5cbiAgICByb2xlc05hbWVzLmZvckVhY2goZnVuY3Rpb24gKHJvbGVOYW1lKSB7XG4gICAgICBSb2xlcy5fcmVtb3ZlUm9sZUZyb21QYXJlbnQocm9sZU5hbWUsIHBhcmVudE5hbWUpXG4gICAgfSlcbiAgfSxcblxuICAvKipcbiAgICogQG1ldGhvZCBfcmVtb3ZlUm9sZUZyb21QYXJlbnRcbiAgICogQHBhcmFtIHtTdHJpbmd9IHJvbGVOYW1lIE5hbWUgb2Ygcm9sZS5cbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhcmVudE5hbWUgTmFtZSBvZiBwYXJlbnQgcm9sZS5cbiAgICogQHByaXZhdGVcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgX3JlbW92ZVJvbGVGcm9tUGFyZW50OiBmdW5jdGlvbiAocm9sZU5hbWUsIHBhcmVudE5hbWUpIHtcbiAgICBSb2xlcy5fY2hlY2tSb2xlTmFtZShyb2xlTmFtZSlcbiAgICBSb2xlcy5fY2hlY2tSb2xlTmFtZShwYXJlbnROYW1lKVxuXG4gICAgLy8gY2hlY2sgZm9yIHJvbGUgZXhpc3RlbmNlXG4gICAgLy8gdGhpcyB3b3VsZCBub3QgcmVhbGx5IGJlIG5lZWRlZCwgYnV0IHdlIGFyZSB0cnlpbmcgdG8gbWF0Y2ggYWRkUm9sZXNUb1BhcmVudFxuICAgIGNvbnN0IHJvbGUgPSBNZXRlb3Iucm9sZXMuZmluZE9uZSh7IF9pZDogcm9sZU5hbWUgfSwgeyBmaWVsZHM6IHsgX2lkOiAxIH0gfSlcblxuICAgIGlmICghcm9sZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdSb2xlIFxcJycgKyByb2xlTmFtZSArICdcXCcgZG9lcyBub3QgZXhpc3QuJylcbiAgICB9XG5cbiAgICBjb25zdCBjb3VudCA9IE1ldGVvci5yb2xlcy51cGRhdGUoe1xuICAgICAgX2lkOiBwYXJlbnROYW1lXG4gICAgfSwge1xuICAgICAgJHB1bGw6IHtcbiAgICAgICAgY2hpbGRyZW46IHtcbiAgICAgICAgICBfaWQ6IHJvbGUuX2lkXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuXG4gICAgLy8gaWYgdGhlcmUgd2FzIG5vIGNoYW5nZSwgcGFyZW50IHJvbGUgbWlnaHQgbm90IGV4aXN0LCBvciByb2xlIHdhc1xuICAgIC8vIGFscmVhZHkgbm90IGEgc3Vicm9sZTsgaW4gYW55IGNhc2Ugd2UgZG8gbm90IGhhdmUgYW55dGhpbmcgbW9yZSB0byBkb1xuICAgIGlmICghY291bnQpIHJldHVyblxuXG4gICAgLy8gRm9yIGFsbCByb2xlcyB3aG8gaGF2ZSBoYWQgaXQgYXMgYSBkZXBlbmRlbmN5IC4uLlxuICAgIGNvbnN0IHJvbGVzID0gWy4uLlJvbGVzLl9nZXRQYXJlbnRSb2xlTmFtZXMoTWV0ZW9yLnJvbGVzLmZpbmRPbmUoeyBfaWQ6IHBhcmVudE5hbWUgfSkpLCBwYXJlbnROYW1lXVxuXG4gICAgTWV0ZW9yLnJvbGVzLmZpbmQoeyBfaWQ6IHsgJGluOiByb2xlcyB9IH0pLmZldGNoKCkuZm9yRWFjaChyID0+IHtcbiAgICAgIGNvbnN0IGluaGVyaXRlZFJvbGVzID0gUm9sZXMuX2dldEluaGVyaXRlZFJvbGVOYW1lcyhNZXRlb3Iucm9sZXMuZmluZE9uZSh7IF9pZDogci5faWQgfSkpXG4gICAgICBNZXRlb3Iucm9sZUFzc2lnbm1lbnQudXBkYXRlKHtcbiAgICAgICAgJ3JvbGUuX2lkJzogci5faWQsXG4gICAgICAgICdpbmhlcml0ZWRSb2xlcy5faWQnOiByb2xlLl9pZFxuICAgICAgfSwge1xuICAgICAgICAkc2V0OiB7XG4gICAgICAgICAgaW5oZXJpdGVkUm9sZXM6IFtyLl9pZCwgLi4uaW5oZXJpdGVkUm9sZXNdLm1hcChyMiA9PiAoeyBfaWQ6IHIyIH0pKVxuICAgICAgICB9XG4gICAgICB9LCB7IG11bHRpOiB0cnVlIH0pXG4gICAgfSlcbiAgfSxcblxuICAvKipcbiAgICogQWRkIHVzZXJzIHRvIHJvbGVzLlxuICAgKlxuICAgKiBBZGRzIHJvbGVzIHRvIGV4aXN0aW5nIHJvbGVzIGZvciBlYWNoIHVzZXIuXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqICAgICBSb2xlcy5hZGRVc2Vyc1RvUm9sZXModXNlcklkLCAnYWRtaW4nKVxuICAgKiAgICAgUm9sZXMuYWRkVXNlcnNUb1JvbGVzKHVzZXJJZCwgWyd2aWV3LXNlY3JldHMnXSwgJ2V4YW1wbGUuY29tJylcbiAgICogICAgIFJvbGVzLmFkZFVzZXJzVG9Sb2xlcyhbdXNlcjEsIHVzZXIyXSwgWyd1c2VyJywnZWRpdG9yJ10pXG4gICAqICAgICBSb2xlcy5hZGRVc2Vyc1RvUm9sZXMoW3VzZXIxLCB1c2VyMl0sIFsnZ2xvcmlvdXMtYWRtaW4nLCAncGVyZm9ybS1hY3Rpb24nXSwgJ2V4YW1wbGUub3JnJylcbiAgICpcbiAgICogQG1ldGhvZCBhZGRVc2Vyc1RvUm9sZXNcbiAgICogQHBhcmFtIHtBcnJheXxTdHJpbmd9IHVzZXJzIFVzZXIgSUQocykgb3Igb2JqZWN0KHMpIHdpdGggYW4gYF9pZGAgZmllbGQuXG4gICAqIEBwYXJhbSB7QXJyYXl8U3RyaW5nfSByb2xlcyBOYW1lKHMpIG9mIHJvbGVzIHRvIGFkZCB1c2VycyB0by4gUm9sZXMgaGF2ZSB0byBleGlzdC5cbiAgICogQHBhcmFtIHtPYmplY3R8U3RyaW5nfSBbb3B0aW9uc10gT3B0aW9uczpcbiAgICogICAtIGBzY29wZWA6IG5hbWUgb2YgdGhlIHNjb3BlLCBvciBgbnVsbGAgZm9yIHRoZSBnbG9iYWwgcm9sZVxuICAgKiAgIC0gYGlmRXhpc3RzYDogaWYgYHRydWVgLCBkbyBub3QgdGhyb3cgYW4gZXhjZXB0aW9uIGlmIHRoZSByb2xlIGRvZXMgbm90IGV4aXN0XG4gICAqXG4gICAqIEFsdGVybmF0aXZlbHksIGl0IGNhbiBiZSBhIHNjb3BlIG5hbWUgc3RyaW5nLlxuICAgKiBAc3RhdGljXG4gICAqL1xuICBhZGRVc2Vyc1RvUm9sZXM6IGZ1bmN0aW9uICh1c2Vycywgcm9sZXMsIG9wdGlvbnMpIHtcbiAgICBsZXQgaWRcblxuICAgIGlmICghdXNlcnMpIHRocm93IG5ldyBFcnJvcignTWlzc2luZyBcXCd1c2Vyc1xcJyBwYXJhbS4nKVxuICAgIGlmICghcm9sZXMpIHRocm93IG5ldyBFcnJvcignTWlzc2luZyBcXCdyb2xlc1xcJyBwYXJhbS4nKVxuXG4gICAgb3B0aW9ucyA9IFJvbGVzLl9ub3JtYWxpemVPcHRpb25zKG9wdGlvbnMpXG5cbiAgICAvLyBlbnN1cmUgYXJyYXlzXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHVzZXJzKSkgdXNlcnMgPSBbdXNlcnNdXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHJvbGVzKSkgcm9sZXMgPSBbcm9sZXNdXG5cbiAgICBSb2xlcy5fY2hlY2tTY29wZU5hbWUob3B0aW9ucy5zY29wZSlcblxuICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIGlmRXhpc3RzOiBmYWxzZVxuICAgIH0sIG9wdGlvbnMpXG5cbiAgICB1c2Vycy5mb3JFYWNoKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICBpZiAodHlwZW9mIHVzZXIgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIGlkID0gdXNlci5faWRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gdXNlclxuICAgICAgfVxuXG4gICAgICByb2xlcy5mb3JFYWNoKGZ1bmN0aW9uIChyb2xlKSB7XG4gICAgICAgIFJvbGVzLl9hZGRVc2VyVG9Sb2xlKGlkLCByb2xlLCBvcHRpb25zKVxuICAgICAgfSlcbiAgICB9KVxuICB9LFxuXG4gIC8qKlxuICAgKiBTZXQgdXNlcnMnIHJvbGVzLlxuICAgKlxuICAgKiBSZXBsYWNlcyBhbGwgZXhpc3Rpbmcgcm9sZXMgd2l0aCBhIG5ldyBzZXQgb2Ygcm9sZXMuXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqICAgICBSb2xlcy5zZXRVc2VyUm9sZXModXNlcklkLCAnYWRtaW4nKVxuICAgKiAgICAgUm9sZXMuc2V0VXNlclJvbGVzKHVzZXJJZCwgWyd2aWV3LXNlY3JldHMnXSwgJ2V4YW1wbGUuY29tJylcbiAgICogICAgIFJvbGVzLnNldFVzZXJSb2xlcyhbdXNlcjEsIHVzZXIyXSwgWyd1c2VyJywnZWRpdG9yJ10pXG4gICAqICAgICBSb2xlcy5zZXRVc2VyUm9sZXMoW3VzZXIxLCB1c2VyMl0sIFsnZ2xvcmlvdXMtYWRtaW4nLCAncGVyZm9ybS1hY3Rpb24nXSwgJ2V4YW1wbGUub3JnJylcbiAgICpcbiAgICogQG1ldGhvZCBzZXRVc2VyUm9sZXNcbiAgICogQHBhcmFtIHtBcnJheXxTdHJpbmd9IHVzZXJzIFVzZXIgSUQocykgb3Igb2JqZWN0KHMpIHdpdGggYW4gYF9pZGAgZmllbGQuXG4gICAqIEBwYXJhbSB7QXJyYXl8U3RyaW5nfSByb2xlcyBOYW1lKHMpIG9mIHJvbGVzIHRvIGFkZCB1c2VycyB0by4gUm9sZXMgaGF2ZSB0byBleGlzdC5cbiAgICogQHBhcmFtIHtPYmplY3R8U3RyaW5nfSBbb3B0aW9uc10gT3B0aW9uczpcbiAgICogICAtIGBzY29wZWA6IG5hbWUgb2YgdGhlIHNjb3BlLCBvciBgbnVsbGAgZm9yIHRoZSBnbG9iYWwgcm9sZVxuICAgKiAgIC0gYGFueVNjb3BlYDogaWYgYHRydWVgLCByZW1vdmUgYWxsIHJvbGVzIHRoZSB1c2VyIGhhcywgb2YgYW55IHNjb3BlLCBpZiBgZmFsc2VgLCBvbmx5IHRoZSBvbmUgaW4gdGhlIHNhbWUgc2NvcGVcbiAgICogICAtIGBpZkV4aXN0c2A6IGlmIGB0cnVlYCwgZG8gbm90IHRocm93IGFuIGV4Y2VwdGlvbiBpZiB0aGUgcm9sZSBkb2VzIG5vdCBleGlzdFxuICAgKlxuICAgKiBBbHRlcm5hdGl2ZWx5LCBpdCBjYW4gYmUgYSBzY29wZSBuYW1lIHN0cmluZy5cbiAgICogQHN0YXRpY1xuICAgKi9cbiAgc2V0VXNlclJvbGVzOiBmdW5jdGlvbiAodXNlcnMsIHJvbGVzLCBvcHRpb25zKSB7XG4gICAgbGV0IGlkXG5cbiAgICBpZiAoIXVzZXJzKSB0aHJvdyBuZXcgRXJyb3IoJ01pc3NpbmcgXFwndXNlcnNcXCcgcGFyYW0uJylcbiAgICBpZiAoIXJvbGVzKSB0aHJvdyBuZXcgRXJyb3IoJ01pc3NpbmcgXFwncm9sZXNcXCcgcGFyYW0uJylcblxuICAgIG9wdGlvbnMgPSBSb2xlcy5fbm9ybWFsaXplT3B0aW9ucyhvcHRpb25zKVxuXG4gICAgLy8gZW5zdXJlIGFycmF5c1xuICAgIGlmICghQXJyYXkuaXNBcnJheSh1c2VycykpIHVzZXJzID0gW3VzZXJzXVxuICAgIGlmICghQXJyYXkuaXNBcnJheShyb2xlcykpIHJvbGVzID0gW3JvbGVzXVxuXG4gICAgUm9sZXMuX2NoZWNrU2NvcGVOYW1lKG9wdGlvbnMuc2NvcGUpXG5cbiAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICBpZkV4aXN0czogZmFsc2UsXG4gICAgICBhbnlTY29wZTogZmFsc2VcbiAgICB9LCBvcHRpb25zKVxuXG4gICAgdXNlcnMuZm9yRWFjaChmdW5jdGlvbiAodXNlcikge1xuICAgICAgaWYgKHR5cGVvZiB1c2VyID09PSAnb2JqZWN0Jykge1xuICAgICAgICBpZCA9IHVzZXIuX2lkXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZCA9IHVzZXJcbiAgICAgIH1cbiAgICAgIC8vIHdlIGZpcnN0IGNsZWFyIGFsbCByb2xlcyBmb3IgdGhlIHVzZXJcbiAgICAgIGNvbnN0IHNlbGVjdG9yID0geyAndXNlci5faWQnOiBpZCB9XG4gICAgICBpZiAoIW9wdGlvbnMuYW55U2NvcGUpIHtcbiAgICAgICAgc2VsZWN0b3Iuc2NvcGUgPSBvcHRpb25zLnNjb3BlXG4gICAgICB9XG5cbiAgICAgIE1ldGVvci5yb2xlQXNzaWdubWVudC5yZW1vdmUoc2VsZWN0b3IpXG5cbiAgICAgIC8vIGFuZCB0aGVuIGFkZCBhbGxcbiAgICAgIHJvbGVzLmZvckVhY2goZnVuY3Rpb24gKHJvbGUpIHtcbiAgICAgICAgUm9sZXMuX2FkZFVzZXJUb1JvbGUoaWQsIHJvbGUsIG9wdGlvbnMpXG4gICAgICB9KVxuICAgIH0pXG4gIH0sXG5cbiAgLyoqXG4gICAqIEFkZCBvbmUgdXNlciB0byBvbmUgcm9sZS5cbiAgICpcbiAgICogQG1ldGhvZCBfYWRkVXNlclRvUm9sZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gdXNlcklkIFRoZSB1c2VyIElELlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcm9sZU5hbWUgTmFtZSBvZiB0aGUgcm9sZSB0byBhZGQgdGhlIHVzZXIgdG8uIFRoZSByb2xlIGhhdmUgdG8gZXhpc3QuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIE9wdGlvbnM6XG4gICAqICAgLSBgc2NvcGVgOiBuYW1lIG9mIHRoZSBzY29wZSwgb3IgYG51bGxgIGZvciB0aGUgZ2xvYmFsIHJvbGVcbiAgICogICAtIGBpZkV4aXN0c2A6IGlmIGB0cnVlYCwgZG8gbm90IHRocm93IGFuIGV4Y2VwdGlvbiBpZiB0aGUgcm9sZSBkb2VzIG5vdCBleGlzdFxuICAgKiBAcHJpdmF0ZVxuICAgKiBAc3RhdGljXG4gICAqL1xuICBfYWRkVXNlclRvUm9sZTogZnVuY3Rpb24gKHVzZXJJZCwgcm9sZU5hbWUsIG9wdGlvbnMpIHtcbiAgICBSb2xlcy5fY2hlY2tSb2xlTmFtZShyb2xlTmFtZSlcbiAgICBSb2xlcy5fY2hlY2tTY29wZU5hbWUob3B0aW9ucy5zY29wZSlcblxuICAgIGlmICghdXNlcklkKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCByb2xlID0gTWV0ZW9yLnJvbGVzLmZpbmRPbmUoeyBfaWQ6IHJvbGVOYW1lIH0sIHsgZmllbGRzOiB7IGNoaWxkcmVuOiAxIH0gfSlcblxuICAgIGlmICghcm9sZSkge1xuICAgICAgaWYgKG9wdGlvbnMuaWZFeGlzdHMpIHtcbiAgICAgICAgcmV0dXJuIFtdXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JvbGUgXFwnJyArIHJvbGVOYW1lICsgJ1xcJyBkb2VzIG5vdCBleGlzdC4nKVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFRoaXMgbWlnaHQgY3JlYXRlIGR1cGxpY2F0ZXMsIGJlY2F1c2Ugd2UgZG9uJ3QgaGF2ZSBhIHVuaXF1ZSBpbmRleCwgYnV0IHRoYXQncyBhbGwgcmlnaHQuIEluIGNhc2UgdGhlcmUgYXJlIHR3bywgd2l0aGRyYXdpbmcgdGhlIHJvbGUgd2lsbCBlZmZlY3RpdmVseSBraWxsIHRoZW0gYm90aC5cbiAgICBjb25zdCByZXMgPSBNZXRlb3Iucm9sZUFzc2lnbm1lbnQudXBzZXJ0KHtcbiAgICAgICd1c2VyLl9pZCc6IHVzZXJJZCxcbiAgICAgICdyb2xlLl9pZCc6IHJvbGVOYW1lLFxuICAgICAgc2NvcGU6IG9wdGlvbnMuc2NvcGVcbiAgICB9LCB7XG4gICAgICAkc2V0T25JbnNlcnQ6IHtcbiAgICAgICAgdXNlcjogeyBfaWQ6IHVzZXJJZCB9LFxuICAgICAgICByb2xlOiB7IF9pZDogcm9sZU5hbWUgfSxcbiAgICAgICAgc2NvcGU6IG9wdGlvbnMuc2NvcGVcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgaWYgKHJlcy5pbnNlcnRlZElkKSB7XG4gICAgICBNZXRlb3Iucm9sZUFzc2lnbm1lbnQudXBkYXRlKHsgX2lkOiByZXMuaW5zZXJ0ZWRJZCB9LCB7XG4gICAgICAgICRzZXQ6IHtcbiAgICAgICAgICBpbmhlcml0ZWRSb2xlczogW3JvbGVOYW1lLCAuLi5Sb2xlcy5fZ2V0SW5oZXJpdGVkUm9sZU5hbWVzKHJvbGUpXS5tYXAociA9PiAoeyBfaWQ6IHIgfSkpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc1xuICB9LFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIHJvbGUgbmFtZXMgdGhlIGdpdmVuIHJvbGUgbmFtZSBpcyBhIGNoaWxkIG9mLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiAgICAgUm9sZXMuX2dldFBhcmVudFJvbGVOYW1lcyh7IF9pZDogJ2FkbWluJywgY2hpbGRyZW47IFtdIH0pXG4gICAqXG4gICAqIEBtZXRob2QgX2dldFBhcmVudFJvbGVOYW1lc1xuICAgKiBAcGFyYW0ge29iamVjdH0gcm9sZSBUaGUgcm9sZSBvYmplY3RcbiAgICogQHByaXZhdGVcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgX2dldFBhcmVudFJvbGVOYW1lczogZnVuY3Rpb24gKHJvbGUpIHtcbiAgICBpZiAoIXJvbGUpIHtcbiAgICAgIHJldHVybiBbXVxuICAgIH1cblxuICAgIGNvbnN0IHBhcmVudFJvbGVzID0gbmV3IFNldChbcm9sZS5faWRdKVxuXG4gICAgcGFyZW50Um9sZXMuZm9yRWFjaChyb2xlTmFtZSA9PiB7XG4gICAgICBNZXRlb3Iucm9sZXMuZmluZCh7ICdjaGlsZHJlbi5faWQnOiByb2xlTmFtZSB9KS5mZXRjaCgpLmZvckVhY2gocGFyZW50Um9sZSA9PiB7XG4gICAgICAgIHBhcmVudFJvbGVzLmFkZChwYXJlbnRSb2xlLl9pZClcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIHBhcmVudFJvbGVzLmRlbGV0ZShyb2xlLl9pZClcblxuICAgIHJldHVybiBbLi4ucGFyZW50Um9sZXNdXG4gIH0sXG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gYXJyYXkgb2Ygcm9sZSBuYW1lcyB0aGUgZ2l2ZW4gcm9sZSBuYW1lIGlzIGEgcGFyZW50IG9mLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiAgICAgUm9sZXMuX2dldEluaGVyaXRlZFJvbGVOYW1lcyh7IF9pZDogJ2FkbWluJywgY2hpbGRyZW47IFtdIH0pXG4gICAqXG4gICAqIEBtZXRob2QgX2dldEluaGVyaXRlZFJvbGVOYW1lc1xuICAgKiBAcGFyYW0ge29iamVjdH0gcm9sZSBUaGUgcm9sZSBvYmplY3RcbiAgICogQHByaXZhdGVcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgX2dldEluaGVyaXRlZFJvbGVOYW1lczogZnVuY3Rpb24gKHJvbGUpIHtcbiAgICBjb25zdCBpbmhlcml0ZWRSb2xlcyA9IG5ldyBTZXQoKVxuICAgIGNvbnN0IG5lc3RlZFJvbGVzID0gbmV3IFNldChbcm9sZV0pXG5cbiAgICBuZXN0ZWRSb2xlcy5mb3JFYWNoKHIgPT4ge1xuICAgICAgY29uc3Qgcm9sZXMgPSBNZXRlb3Iucm9sZXMuZmluZCh7IF9pZDogeyAkaW46IHIuY2hpbGRyZW4ubWFwKHIgPT4gci5faWQpIH0gfSwgeyBmaWVsZHM6IHsgY2hpbGRyZW46IDEgfSB9KS5mZXRjaCgpXG5cbiAgICAgIHJvbGVzLmZvckVhY2gocjIgPT4ge1xuICAgICAgICBpbmhlcml0ZWRSb2xlcy5hZGQocjIuX2lkKVxuICAgICAgICBuZXN0ZWRSb2xlcy5hZGQocjIpXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICByZXR1cm4gWy4uLmluaGVyaXRlZFJvbGVzXVxuICB9LFxuXG4gIC8qKlxuICAgKiBSZW1vdmUgdXNlcnMgZnJvbSBhc3NpZ25lZCByb2xlcy5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogICAgIFJvbGVzLnJlbW92ZVVzZXJzRnJvbVJvbGVzKHVzZXJJZCwgJ2FkbWluJylcbiAgICogICAgIFJvbGVzLnJlbW92ZVVzZXJzRnJvbVJvbGVzKFt1c2VySWQsIHVzZXIyXSwgWydlZGl0b3InXSlcbiAgICogICAgIFJvbGVzLnJlbW92ZVVzZXJzRnJvbVJvbGVzKHVzZXJJZCwgWyd1c2VyJ10sICdncm91cDEnKVxuICAgKlxuICAgKiBAbWV0aG9kIHJlbW92ZVVzZXJzRnJvbVJvbGVzXG4gICAqIEBwYXJhbSB7QXJyYXl8U3RyaW5nfSB1c2VycyBVc2VyIElEKHMpIG9yIG9iamVjdChzKSB3aXRoIGFuIGBfaWRgIGZpZWxkLlxuICAgKiBAcGFyYW0ge0FycmF5fFN0cmluZ30gcm9sZXMgTmFtZShzKSBvZiByb2xlcyB0byByZW1vdmUgdXNlcnMgZnJvbS4gUm9sZXMgaGF2ZSB0byBleGlzdC5cbiAgICogQHBhcmFtIHtPYmplY3R8U3RyaW5nfSBbb3B0aW9uc10gT3B0aW9uczpcbiAgICogICAtIGBzY29wZWA6IG5hbWUgb2YgdGhlIHNjb3BlLCBvciBgbnVsbGAgZm9yIHRoZSBnbG9iYWwgcm9sZVxuICAgKiAgIC0gYGFueVNjb3BlYDogaWYgc2V0LCByb2xlIGNhbiBiZSBpbiBhbnkgc2NvcGUgKGBzY29wZWAgb3B0aW9uIGlzIGlnbm9yZWQpXG4gICAqXG4gICAqIEFsdGVybmF0aXZlbHksIGl0IGNhbiBiZSBhIHNjb3BlIG5hbWUgc3RyaW5nLlxuICAgKiBAc3RhdGljXG4gICAqL1xuICByZW1vdmVVc2Vyc0Zyb21Sb2xlczogZnVuY3Rpb24gKHVzZXJzLCByb2xlcywgb3B0aW9ucykge1xuICAgIGlmICghdXNlcnMpIHRocm93IG5ldyBFcnJvcignTWlzc2luZyBcXCd1c2Vyc1xcJyBwYXJhbS4nKVxuICAgIGlmICghcm9sZXMpIHRocm93IG5ldyBFcnJvcignTWlzc2luZyBcXCdyb2xlc1xcJyBwYXJhbS4nKVxuXG4gICAgb3B0aW9ucyA9IFJvbGVzLl9ub3JtYWxpemVPcHRpb25zKG9wdGlvbnMpXG5cbiAgICAvLyBlbnN1cmUgYXJyYXlzXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHVzZXJzKSkgdXNlcnMgPSBbdXNlcnNdXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHJvbGVzKSkgcm9sZXMgPSBbcm9sZXNdXG5cbiAgICBSb2xlcy5fY2hlY2tTY29wZU5hbWUob3B0aW9ucy5zY29wZSlcblxuICAgIHVzZXJzLmZvckVhY2goZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgIGlmICghdXNlcikgcmV0dXJuXG5cbiAgICAgIHJvbGVzLmZvckVhY2goZnVuY3Rpb24gKHJvbGUpIHtcbiAgICAgICAgbGV0IGlkXG4gICAgICAgIGlmICh0eXBlb2YgdXNlciA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICBpZCA9IHVzZXIuX2lkXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWQgPSB1c2VyXG4gICAgICAgIH1cblxuICAgICAgICBSb2xlcy5fcmVtb3ZlVXNlckZyb21Sb2xlKGlkLCByb2xlLCBvcHRpb25zKVxuICAgICAgfSlcbiAgICB9KVxuICB9LFxuXG4gIC8qKlxuICAgKiBSZW1vdmUgb25lIHVzZXIgZnJvbSBvbmUgcm9sZS5cbiAgICpcbiAgICogQG1ldGhvZCBfcmVtb3ZlVXNlckZyb21Sb2xlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSB1c2VySWQgVGhlIHVzZXIgSUQuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSByb2xlTmFtZSBOYW1lIG9mIHRoZSByb2xlIHRvIGFkZCB0aGUgdXNlciB0by4gVGhlIHJvbGUgaGF2ZSB0byBleGlzdC5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgT3B0aW9uczpcbiAgICogICAtIGBzY29wZWA6IG5hbWUgb2YgdGhlIHNjb3BlLCBvciBgbnVsbGAgZm9yIHRoZSBnbG9iYWwgcm9sZVxuICAgKiAgIC0gYGFueVNjb3BlYDogaWYgc2V0LCByb2xlIGNhbiBiZSBpbiBhbnkgc2NvcGUgKGBzY29wZWAgb3B0aW9uIGlzIGlnbm9yZWQpXG4gICAqIEBwcml2YXRlXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIF9yZW1vdmVVc2VyRnJvbVJvbGU6IGZ1bmN0aW9uICh1c2VySWQsIHJvbGVOYW1lLCBvcHRpb25zKSB7XG4gICAgUm9sZXMuX2NoZWNrUm9sZU5hbWUocm9sZU5hbWUpXG4gICAgUm9sZXMuX2NoZWNrU2NvcGVOYW1lKG9wdGlvbnMuc2NvcGUpXG5cbiAgICBpZiAoIXVzZXJJZCkgcmV0dXJuXG5cbiAgICBjb25zdCBzZWxlY3RvciA9IHtcbiAgICAgICd1c2VyLl9pZCc6IHVzZXJJZCxcbiAgICAgICdyb2xlLl9pZCc6IHJvbGVOYW1lXG4gICAgfVxuXG4gICAgaWYgKCFvcHRpb25zLmFueVNjb3BlKSB7XG4gICAgICBzZWxlY3Rvci5zY29wZSA9IG9wdGlvbnMuc2NvcGVcbiAgICB9XG5cbiAgICBNZXRlb3Iucm9sZUFzc2lnbm1lbnQucmVtb3ZlKHNlbGVjdG9yKVxuICB9LFxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiB1c2VyIGhhcyBzcGVjaWZpZWQgcm9sZXMuXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqICAgICAvLyBnbG9iYWwgcm9sZXNcbiAgICogICAgIFJvbGVzLnVzZXJJc0luUm9sZSh1c2VyLCAnYWRtaW4nKVxuICAgKiAgICAgUm9sZXMudXNlcklzSW5Sb2xlKHVzZXIsIFsnYWRtaW4nLCdlZGl0b3InXSlcbiAgICogICAgIFJvbGVzLnVzZXJJc0luUm9sZSh1c2VySWQsICdhZG1pbicpXG4gICAqICAgICBSb2xlcy51c2VySXNJblJvbGUodXNlcklkLCBbJ2FkbWluJywnZWRpdG9yJ10pXG4gICAqXG4gICAqICAgICAvLyBzY29wZSByb2xlcyAoZ2xvYmFsIHJvbGVzIGFyZSBzdGlsbCBjaGVja2VkKVxuICAgKiAgICAgUm9sZXMudXNlcklzSW5Sb2xlKHVzZXIsICdhZG1pbicsICdncm91cDEnKVxuICAgKiAgICAgUm9sZXMudXNlcklzSW5Sb2xlKHVzZXJJZCwgWydhZG1pbicsJ2VkaXRvciddLCAnZ3JvdXAxJylcbiAgICogICAgIFJvbGVzLnVzZXJJc0luUm9sZSh1c2VySWQsIFsnYWRtaW4nLCdlZGl0b3InXSwge3Njb3BlOiAnZ3JvdXAxJ30pXG4gICAqXG4gICAqIEBtZXRob2QgdXNlcklzSW5Sb2xlXG4gICAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdH0gdXNlciBVc2VyIElEIG9yIGFuIGFjdHVhbCB1c2VyIG9iamVjdC5cbiAgICogQHBhcmFtIHtBcnJheXxTdHJpbmd9IHJvbGVzIE5hbWUgb2Ygcm9sZSBvciBhbiBhcnJheSBvZiByb2xlcyB0byBjaGVjayBhZ2FpbnN0LiBJZiBhcnJheSxcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbGwgcmV0dXJuIGB0cnVlYCBpZiB1c2VyIGlzIGluIF9hbnlfIHJvbGUuXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSb2xlcyBkbyBub3QgaGF2ZSB0byBleGlzdC5cbiAgICogQHBhcmFtIHtPYmplY3R8U3RyaW5nfSBbb3B0aW9uc10gT3B0aW9uczpcbiAgICogICAtIGBzY29wZWA6IG5hbWUgb2YgdGhlIHNjb3BlOyBpZiBzdXBwbGllZCwgbGltaXRzIGNoZWNrIHRvIGp1c3QgdGhhdCBzY29wZVxuICAgKiAgICAgdGhlIHVzZXIncyBnbG9iYWwgcm9sZXMgd2lsbCBhbHdheXMgYmUgY2hlY2tlZCB3aGV0aGVyIHNjb3BlIGlzIHNwZWNpZmllZCBvciBub3RcbiAgICogICAtIGBhbnlTY29wZWA6IGlmIHNldCwgcm9sZSBjYW4gYmUgaW4gYW55IHNjb3BlIChgc2NvcGVgIG9wdGlvbiBpcyBpZ25vcmVkKVxuICAgKlxuICAgKiBBbHRlcm5hdGl2ZWx5LCBpdCBjYW4gYmUgYSBzY29wZSBuYW1lIHN0cmluZy5cbiAgICogQHJldHVybiB7Qm9vbGVhbn0gYHRydWVgIGlmIHVzZXIgaXMgaW4gX2FueV8gb2YgdGhlIHRhcmdldCByb2xlc1xuICAgKiBAc3RhdGljXG4gICAqL1xuICB1c2VySXNJblJvbGU6IGZ1bmN0aW9uICh1c2VyLCByb2xlcywgb3B0aW9ucykge1xuICAgIGxldCBpZFxuICAgIG9wdGlvbnMgPSBSb2xlcy5fbm9ybWFsaXplT3B0aW9ucyhvcHRpb25zKVxuXG4gICAgLy8gZW5zdXJlIGFycmF5IHRvIHNpbXBsaWZ5IGNvZGVcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkocm9sZXMpKSByb2xlcyA9IFtyb2xlc11cblxuICAgIHJvbGVzID0gcm9sZXMuZmlsdGVyKHIgPT4gciAhPSBudWxsKVxuXG4gICAgaWYgKCFyb2xlcy5sZW5ndGgpIHJldHVybiBmYWxzZVxuXG4gICAgUm9sZXMuX2NoZWNrU2NvcGVOYW1lKG9wdGlvbnMuc2NvcGUpXG5cbiAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICBhbnlTY29wZTogZmFsc2VcbiAgICB9LCBvcHRpb25zKVxuXG4gICAgaWYgKHVzZXIgJiYgdHlwZW9mIHVzZXIgPT09ICdvYmplY3QnKSB7XG4gICAgICBpZCA9IHVzZXIuX2lkXG4gICAgfSBlbHNlIHtcbiAgICAgIGlkID0gdXNlclxuICAgIH1cblxuICAgIGlmICghaWQpIHJldHVybiBmYWxzZVxuICAgIGlmICh0eXBlb2YgaWQgIT09ICdzdHJpbmcnKSByZXR1cm4gZmFsc2VcblxuICAgIGNvbnN0IHNlbGVjdG9yID0geyAndXNlci5faWQnOiBpZCB9XG5cbiAgICBpZiAoIW9wdGlvbnMuYW55U2NvcGUpIHtcbiAgICAgIHNlbGVjdG9yLnNjb3BlID0geyAkaW46IFtvcHRpb25zLnNjb3BlLCBudWxsXSB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJvbGVzLnNvbWUoKHJvbGVOYW1lKSA9PiB7XG4gICAgICBzZWxlY3RvclsnaW5oZXJpdGVkUm9sZXMuX2lkJ10gPSByb2xlTmFtZVxuXG4gICAgICByZXR1cm4gTWV0ZW9yLnJvbGVBc3NpZ25tZW50LmZpbmQoc2VsZWN0b3IsIHsgbGltaXQ6IDEgfSkuY291bnQoKSA+IDBcbiAgICB9KVxuICB9LFxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZSB1c2VyJ3Mgcm9sZXMuXG4gICAqXG4gICAqIEBtZXRob2QgZ2V0Um9sZXNGb3JVc2VyXG4gICAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdH0gdXNlciBVc2VyIElEIG9yIGFuIGFjdHVhbCB1c2VyIG9iamVjdC5cbiAgICogQHBhcmFtIHtPYmplY3R8U3RyaW5nfSBbb3B0aW9uc10gT3B0aW9uczpcbiAgICogICAtIGBzY29wZWA6IG5hbWUgb2Ygc2NvcGUgdG8gcHJvdmlkZSByb2xlcyBmb3I7IGlmIG5vdCBzcGVjaWZpZWQsIGdsb2JhbCByb2xlcyBhcmUgcmV0dXJuZWRcbiAgICogICAtIGBhbnlTY29wZWA6IGlmIHNldCwgcm9sZSBjYW4gYmUgaW4gYW55IHNjb3BlIChgc2NvcGVgIGFuZCBgb25seUFzc2lnbmVkYCBvcHRpb25zIGFyZSBpZ25vcmVkKVxuICAgKiAgIC0gYG9ubHlTY29wZWRgOiBpZiBzZXQsIG9ubHkgcm9sZXMgaW4gdGhlIHNwZWNpZmllZCBzY29wZSBhcmUgcmV0dXJuZWRcbiAgICogICAtIGBvbmx5QXNzaWduZWRgOiByZXR1cm4gb25seSBhc3NpZ25lZCByb2xlcyBhbmQgbm90IGF1dG9tYXRpY2FsbHkgaW5mZXJyZWQgKGxpa2Ugc3Vicm9sZXMpXG4gICAqICAgLSBgZnVsbE9iamVjdHNgOiByZXR1cm4gZnVsbCByb2xlcyBvYmplY3RzIChgdHJ1ZWApIG9yIGp1c3QgbmFtZXMgKGBmYWxzZWApIChgb25seUFzc2lnbmVkYCBvcHRpb24gaXMgaWdub3JlZCkgKGRlZmF1bHQgYGZhbHNlYClcbiAgICogICAgIElmIHlvdSBoYXZlIGEgdXNlLWNhc2UgZm9yIHRoaXMgb3B0aW9uLCBwbGVhc2UgZmlsZSBhIGZlYXR1cmUtcmVxdWVzdC4gWW91IHNob3VsZG4ndCBuZWVkIHRvIHVzZSBpdCBhcyBpdCdzXG4gICAqICAgICByZXN1bHQgc3Ryb25nbHkgZGVwZW5kZW50IG9uIHRoZSBpbnRlcm5hbCBkYXRhIHN0cnVjdHVyZSBvZiB0aGlzIHBsdWdpbi5cbiAgICpcbiAgICogQWx0ZXJuYXRpdmVseSwgaXQgY2FuIGJlIGEgc2NvcGUgbmFtZSBzdHJpbmcuXG4gICAqIEByZXR1cm4ge0FycmF5fSBBcnJheSBvZiB1c2VyJ3Mgcm9sZXMsIHVuc29ydGVkLlxuICAgKiBAc3RhdGljXG4gICAqL1xuICBnZXRSb2xlc0ZvclVzZXI6IGZ1bmN0aW9uICh1c2VyLCBvcHRpb25zKSB7XG4gICAgbGV0IGlkXG5cbiAgICBvcHRpb25zID0gUm9sZXMuX25vcm1hbGl6ZU9wdGlvbnMob3B0aW9ucylcblxuICAgIFJvbGVzLl9jaGVja1Njb3BlTmFtZShvcHRpb25zLnNjb3BlKVxuXG4gICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgZnVsbE9iamVjdHM6IGZhbHNlLFxuICAgICAgb25seUFzc2lnbmVkOiBmYWxzZSxcbiAgICAgIGFueVNjb3BlOiBmYWxzZSxcbiAgICAgIG9ubHlTY29wZWQ6IGZhbHNlXG4gICAgfSwgb3B0aW9ucylcblxuICAgIGlmICh1c2VyICYmIHR5cGVvZiB1c2VyID09PSAnb2JqZWN0Jykge1xuICAgICAgaWQgPSB1c2VyLl9pZFxuICAgIH0gZWxzZSB7XG4gICAgICBpZCA9IHVzZXJcbiAgICB9XG5cbiAgICBpZiAoIWlkKSByZXR1cm4gW11cblxuICAgIGNvbnN0IHNlbGVjdG9yID0geyAndXNlci5faWQnOiBpZCB9XG4gICAgY29uc3QgZmlsdGVyID0geyBmaWVsZHM6IHsgJ2luaGVyaXRlZFJvbGVzLl9pZCc6IDEgfSB9XG5cbiAgICBpZiAoIW9wdGlvbnMuYW55U2NvcGUpIHtcbiAgICAgIHNlbGVjdG9yLnNjb3BlID0geyAkaW46IFtvcHRpb25zLnNjb3BlXSB9XG5cbiAgICAgIGlmICghb3B0aW9ucy5vbmx5U2NvcGVkKSB7XG4gICAgICAgIHNlbGVjdG9yLnNjb3BlLiRpbi5wdXNoKG51bGwpXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMub25seUFzc2lnbmVkKSB7XG4gICAgICBkZWxldGUgZmlsdGVyLmZpZWxkc1snaW5oZXJpdGVkUm9sZXMuX2lkJ11cbiAgICAgIGZpbHRlci5maWVsZHNbJ3JvbGUuX2lkJ10gPSAxXG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMuZnVsbE9iamVjdHMpIHtcbiAgICAgIGRlbGV0ZSBmaWx0ZXIuZmllbGRzXG4gICAgfVxuXG4gICAgY29uc3Qgcm9sZXMgPSBNZXRlb3Iucm9sZUFzc2lnbm1lbnQuZmluZChzZWxlY3RvciwgZmlsdGVyKS5mZXRjaCgpXG5cbiAgICBpZiAob3B0aW9ucy5mdWxsT2JqZWN0cykge1xuICAgICAgcmV0dXJuIHJvbGVzXG4gICAgfVxuXG4gICAgcmV0dXJuIFsuLi5uZXcgU2V0KHJvbGVzLnJlZHVjZSgocmV2LCBjdXJyZW50KSA9PiB7XG4gICAgICBpZiAoY3VycmVudC5pbmhlcml0ZWRSb2xlcykge1xuICAgICAgICByZXR1cm4gcmV2LmNvbmNhdChjdXJyZW50LmluaGVyaXRlZFJvbGVzLm1hcChyID0+IHIuX2lkKSlcbiAgICAgIH0gZWxzZSBpZiAoY3VycmVudC5yb2xlKSB7XG4gICAgICAgIHJldi5wdXNoKGN1cnJlbnQucm9sZS5faWQpXG4gICAgICB9XG4gICAgICByZXR1cm4gcmV2XG4gICAgfSwgW10pKV1cbiAgfSxcblxuICAvKipcbiAgICogUmV0cmlldmUgY3Vyc29yIG9mIGFsbCBleGlzdGluZyByb2xlcy5cbiAgICpcbiAgICogQG1ldGhvZCBnZXRBbGxSb2xlc1xuICAgKiBAcGFyYW0ge09iamVjdH0gcXVlcnlPcHRpb25zIE9wdGlvbnMgd2hpY2ggYXJlIHBhc3NlZCBkaXJlY3RseVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3VnaCB0byBgTWV0ZW9yLnJvbGVzLmZpbmQocXVlcnksIG9wdGlvbnMpYC5cbiAgICogQHJldHVybiB7Q3Vyc29yfSBDdXJzb3Igb2YgZXhpc3Rpbmcgcm9sZXMuXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIGdldEFsbFJvbGVzOiBmdW5jdGlvbiAocXVlcnlPcHRpb25zKSB7XG4gICAgcXVlcnlPcHRpb25zID0gcXVlcnlPcHRpb25zIHx8IHsgc29ydDogeyBfaWQ6IDEgfSB9XG5cbiAgICByZXR1cm4gTWV0ZW9yLnJvbGVzLmZpbmQoe30sIHF1ZXJ5T3B0aW9ucylcbiAgfSxcblxuICAvKipcbiAgICogUmV0cmlldmUgYWxsIHVzZXJzIHdobyBhcmUgaW4gdGFyZ2V0IHJvbGUuXG4gICAqXG4gICAqIE9wdGlvbnM6XG4gICAqXG4gICAqIEBtZXRob2QgZ2V0VXNlcnNJblJvbGVcbiAgICogQHBhcmFtIHtBcnJheXxTdHJpbmd9IHJvbGVzIE5hbWUgb2Ygcm9sZSBvciBhbiBhcnJheSBvZiByb2xlcy4gSWYgYXJyYXksIHVzZXJzXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5lZCB3aWxsIGhhdmUgYXQgbGVhc3Qgb25lIG9mIHRoZSByb2xlc1xuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3BlY2lmaWVkIGJ1dCBuZWVkIG5vdCBoYXZlIF9hbGxfIHJvbGVzLlxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUm9sZXMgZG8gbm90IGhhdmUgdG8gZXhpc3QuXG4gICAqIEBwYXJhbSB7T2JqZWN0fFN0cmluZ30gW29wdGlvbnNdIE9wdGlvbnM6XG4gICAqICAgLSBgc2NvcGVgOiBuYW1lIG9mIHRoZSBzY29wZSB0byByZXN0cmljdCByb2xlcyB0bzsgdXNlcidzIGdsb2JhbFxuICAgKiAgICAgcm9sZXMgd2lsbCBhbHNvIGJlIGNoZWNrZWRcbiAgICogICAtIGBhbnlTY29wZWA6IGlmIHNldCwgcm9sZSBjYW4gYmUgaW4gYW55IHNjb3BlIChgc2NvcGVgIG9wdGlvbiBpcyBpZ25vcmVkKVxuICAgKiAgIC0gYG9ubHlTY29wZWRgOiBpZiBzZXQsIG9ubHkgcm9sZXMgaW4gdGhlIHNwZWNpZmllZCBzY29wZSBhcmUgcmV0dXJuZWRcbiAgICogICAtIGBxdWVyeU9wdGlvbnNgOiBvcHRpb25zIHdoaWNoIGFyZSBwYXNzZWQgZGlyZWN0bHlcbiAgICogICAgIHRocm91Z2ggdG8gYE1ldGVvci51c2Vycy5maW5kKHF1ZXJ5LCBvcHRpb25zKWBcbiAgICpcbiAgICogQWx0ZXJuYXRpdmVseSwgaXQgY2FuIGJlIGEgc2NvcGUgbmFtZSBzdHJpbmcuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbcXVlcnlPcHRpb25zXSBPcHRpb25zIHdoaWNoIGFyZSBwYXNzZWQgZGlyZWN0bHlcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm91Z2ggdG8gYE1ldGVvci51c2Vycy5maW5kKHF1ZXJ5LCBvcHRpb25zKWBcbiAgICogQHJldHVybiB7Q3Vyc29yfSBDdXJzb3Igb2YgdXNlcnMgaW4gcm9sZXMuXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIGdldFVzZXJzSW5Sb2xlOiBmdW5jdGlvbiAocm9sZXMsIG9wdGlvbnMsIHF1ZXJ5T3B0aW9ucykge1xuICAgIGNvbnN0IGlkcyA9IFJvbGVzLmdldFVzZXJBc3NpZ25tZW50c0ZvclJvbGUocm9sZXMsIG9wdGlvbnMpLmZldGNoKCkubWFwKGEgPT4gYS51c2VyLl9pZClcblxuICAgIHJldHVybiBNZXRlb3IudXNlcnMuZmluZCh7IF9pZDogeyAkaW46IGlkcyB9IH0sICgob3B0aW9ucyAmJiBvcHRpb25zLnF1ZXJ5T3B0aW9ucykgfHwgcXVlcnlPcHRpb25zKSB8fCB7fSlcbiAgfSxcblxuICAvKipcbiAgICogUmV0cmlldmUgYWxsIGFzc2lnbm1lbnRzIG9mIGEgdXNlciB3aGljaCBhcmUgZm9yIHRoZSB0YXJnZXQgcm9sZS5cbiAgICpcbiAgICogT3B0aW9uczpcbiAgICpcbiAgICogQG1ldGhvZCBnZXRVc2VyQXNzaWdubWVudHNGb3JSb2xlXG4gICAqIEBwYXJhbSB7QXJyYXl8U3RyaW5nfSByb2xlcyBOYW1lIG9mIHJvbGUgb3IgYW4gYXJyYXkgb2Ygcm9sZXMuIElmIGFycmF5LCB1c2Vyc1xuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuZWQgd2lsbCBoYXZlIGF0IGxlYXN0IG9uZSBvZiB0aGUgcm9sZXNcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNwZWNpZmllZCBidXQgbmVlZCBub3QgaGF2ZSBfYWxsXyByb2xlcy5cbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJvbGVzIGRvIG5vdCBoYXZlIHRvIGV4aXN0LlxuICAgKiBAcGFyYW0ge09iamVjdHxTdHJpbmd9IFtvcHRpb25zXSBPcHRpb25zOlxuICAgKiAgIC0gYHNjb3BlYDogbmFtZSBvZiB0aGUgc2NvcGUgdG8gcmVzdHJpY3Qgcm9sZXMgdG87IHVzZXIncyBnbG9iYWxcbiAgICogICAgIHJvbGVzIHdpbGwgYWxzbyBiZSBjaGVja2VkXG4gICAqICAgLSBgYW55U2NvcGVgOiBpZiBzZXQsIHJvbGUgY2FuIGJlIGluIGFueSBzY29wZSAoYHNjb3BlYCBvcHRpb24gaXMgaWdub3JlZClcbiAgICogICAtIGBxdWVyeU9wdGlvbnNgOiBvcHRpb25zIHdoaWNoIGFyZSBwYXNzZWQgZGlyZWN0bHlcbiAgICogICAgIHRocm91Z2ggdG8gYE1ldGVvci5yb2xlQXNzaWdubWVudC5maW5kKHF1ZXJ5LCBvcHRpb25zKWBcbiAgICpcbiAgICogQWx0ZXJuYXRpdmVseSwgaXQgY2FuIGJlIGEgc2NvcGUgbmFtZSBzdHJpbmcuXG4gICAqIEByZXR1cm4ge0N1cnNvcn0gQ3Vyc29yIG9mIHVzZXIgYXNzaWdubWVudHMgZm9yIHJvbGVzLlxuICAgKiBAc3RhdGljXG4gICAqL1xuICBnZXRVc2VyQXNzaWdubWVudHNGb3JSb2xlOiBmdW5jdGlvbiAocm9sZXMsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gUm9sZXMuX25vcm1hbGl6ZU9wdGlvbnMob3B0aW9ucylcblxuICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIGFueVNjb3BlOiBmYWxzZSxcbiAgICAgIHF1ZXJ5T3B0aW9uczoge31cbiAgICB9LCBvcHRpb25zKVxuXG4gICAgcmV0dXJuIFJvbGVzLl9nZXRVc2Vyc0luUm9sZUN1cnNvcihyb2xlcywgb3B0aW9ucywgb3B0aW9ucy5xdWVyeU9wdGlvbnMpXG4gIH0sXG5cbiAgLyoqXG4gICAqIEBtZXRob2QgX2dldFVzZXJzSW5Sb2xlQ3Vyc29yXG4gICAqIEBwYXJhbSB7QXJyYXl8U3RyaW5nfSByb2xlcyBOYW1lIG9mIHJvbGUgb3IgYW4gYXJyYXkgb2Ygcm9sZXMuIElmIGFycmF5LCBpZHMgb2YgdXNlcnMgYXJlXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5lZCB3aGljaCBoYXZlIGF0IGxlYXN0IG9uZSBvZiB0aGUgcm9sZXNcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzc2lnbmVkIGJ1dCBuZWVkIG5vdCBoYXZlIF9hbGxfIHJvbGVzLlxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUm9sZXMgZG8gbm90IGhhdmUgdG8gZXhpc3QuXG4gICAqIEBwYXJhbSB7T2JqZWN0fFN0cmluZ30gW29wdGlvbnNdIE9wdGlvbnM6XG4gICAqICAgLSBgc2NvcGVgOiBuYW1lIG9mIHRoZSBzY29wZSB0byByZXN0cmljdCByb2xlcyB0bzsgdXNlcidzIGdsb2JhbFxuICAgKiAgICAgcm9sZXMgd2lsbCBhbHNvIGJlIGNoZWNrZWRcbiAgICogICAtIGBhbnlTY29wZWA6IGlmIHNldCwgcm9sZSBjYW4gYmUgaW4gYW55IHNjb3BlIChgc2NvcGVgIG9wdGlvbiBpcyBpZ25vcmVkKVxuICAgKlxuICAgKiBBbHRlcm5hdGl2ZWx5LCBpdCBjYW4gYmUgYSBzY29wZSBuYW1lIHN0cmluZy5cbiAgICogQHBhcmFtIHtPYmplY3R9IFtmaWx0ZXJdIE9wdGlvbnMgd2hpY2ggYXJlIHBhc3NlZCBkaXJlY3RseVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3VnaCB0byBgTWV0ZW9yLnJvbGVBc3NpZ25tZW50LmZpbmQocXVlcnksIG9wdGlvbnMpYFxuICAgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnNvciB0byB0aGUgYXNzaWdubWVudCBkb2N1bWVudHNcbiAgICogQHByaXZhdGVcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgX2dldFVzZXJzSW5Sb2xlQ3Vyc29yOiBmdW5jdGlvbiAocm9sZXMsIG9wdGlvbnMsIGZpbHRlcikge1xuICAgIG9wdGlvbnMgPSBSb2xlcy5fbm9ybWFsaXplT3B0aW9ucyhvcHRpb25zKVxuXG4gICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgYW55U2NvcGU6IGZhbHNlLFxuICAgICAgb25seVNjb3BlZDogZmFsc2VcbiAgICB9LCBvcHRpb25zKVxuXG4gICAgLy8gZW5zdXJlIGFycmF5IHRvIHNpbXBsaWZ5IGNvZGVcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkocm9sZXMpKSByb2xlcyA9IFtyb2xlc11cblxuICAgIFJvbGVzLl9jaGVja1Njb3BlTmFtZShvcHRpb25zLnNjb3BlKVxuXG4gICAgZmlsdGVyID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICBmaWVsZHM6IHsgJ3VzZXIuX2lkJzogMSB9XG4gICAgfSwgZmlsdGVyKVxuXG4gICAgY29uc3Qgc2VsZWN0b3IgPSB7ICdpbmhlcml0ZWRSb2xlcy5faWQnOiB7ICRpbjogcm9sZXMgfSB9XG5cbiAgICBpZiAoIW9wdGlvbnMuYW55U2NvcGUpIHtcbiAgICAgIHNlbGVjdG9yLnNjb3BlID0geyAkaW46IFtvcHRpb25zLnNjb3BlXSB9XG5cbiAgICAgIGlmICghb3B0aW9ucy5vbmx5U2NvcGVkKSB7XG4gICAgICAgIHNlbGVjdG9yLnNjb3BlLiRpbi5wdXNoKG51bGwpXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIE1ldGVvci5yb2xlQXNzaWdubWVudC5maW5kKHNlbGVjdG9yLCBmaWx0ZXIpXG4gIH0sXG5cbiAgLyoqXG4gICAqIERlcHJlY2F0ZWQuIFVzZSBgZ2V0U2NvcGVzRm9yVXNlcmAgaW5zdGVhZC5cbiAgICpcbiAgICogQG1ldGhvZCBnZXRHcm91cHNGb3JVc2VyXG4gICAqIEBzdGF0aWNcbiAgICogQGRlcHJlY2F0ZWRcbiAgICovXG4gIGdldEdyb3Vwc0ZvclVzZXI6IGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgaWYgKCFnZXRHcm91cHNGb3JVc2VyRGVwcmVjYXRpb25XYXJuaW5nKSB7XG4gICAgICBnZXRHcm91cHNGb3JVc2VyRGVwcmVjYXRpb25XYXJuaW5nID0gdHJ1ZVxuICAgICAgY29uc29sZSAmJiBjb25zb2xlLndhcm4oJ2dldEdyb3Vwc0ZvclVzZXIgaGFzIGJlZW4gZGVwcmVjYXRlZC4gVXNlIGdldFNjb3Blc0ZvclVzZXIgaW5zdGVhZC4nKVxuICAgIH1cblxuICAgIHJldHVybiBSb2xlcy5nZXRTY29wZXNGb3JVc2VyKC4uLmFyZ3MpXG4gIH0sXG5cbiAgLyoqXG4gICAqIFJldHJpZXZlIHVzZXJzIHNjb3BlcywgaWYgYW55LlxuICAgKlxuICAgKiBAbWV0aG9kIGdldFNjb3Blc0ZvclVzZXJcbiAgICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fSB1c2VyIFVzZXIgSUQgb3IgYW4gYWN0dWFsIHVzZXIgb2JqZWN0LlxuICAgKiBAcGFyYW0ge0FycmF5fFN0cmluZ30gW3JvbGVzXSBOYW1lIG9mIHJvbGVzIHRvIHJlc3RyaWN0IHNjb3BlcyB0by5cbiAgICpcbiAgICogQHJldHVybiB7QXJyYXl9IEFycmF5IG9mIHVzZXIncyBzY29wZXMsIHVuc29ydGVkLlxuICAgKiBAc3RhdGljXG4gICAqL1xuICBnZXRTY29wZXNGb3JVc2VyOiBmdW5jdGlvbiAodXNlciwgcm9sZXMpIHtcbiAgICBsZXQgaWRcblxuICAgIGlmIChyb2xlcyAmJiAhQXJyYXkuaXNBcnJheShyb2xlcykpIHJvbGVzID0gW3JvbGVzXVxuXG4gICAgaWYgKHVzZXIgJiYgdHlwZW9mIHVzZXIgPT09ICdvYmplY3QnKSB7XG4gICAgICBpZCA9IHVzZXIuX2lkXG4gICAgfSBlbHNlIHtcbiAgICAgIGlkID0gdXNlclxuICAgIH1cblxuICAgIGlmICghaWQpIHJldHVybiBbXVxuXG4gICAgY29uc3Qgc2VsZWN0b3IgPSB7XG4gICAgICAndXNlci5faWQnOiBpZCxcbiAgICAgIHNjb3BlOiB7ICRuZTogbnVsbCB9XG4gICAgfVxuXG4gICAgaWYgKHJvbGVzKSB7XG4gICAgICBzZWxlY3RvclsnaW5oZXJpdGVkUm9sZXMuX2lkJ10gPSB7ICRpbjogcm9sZXMgfVxuICAgIH1cblxuICAgIGNvbnN0IHNjb3BlcyA9IE1ldGVvci5yb2xlQXNzaWdubWVudC5maW5kKHNlbGVjdG9yLCB7IGZpZWxkczogeyBzY29wZTogMSB9IH0pLmZldGNoKCkubWFwKG9iaSA9PiBvYmkuc2NvcGUpXG5cbiAgICByZXR1cm4gWy4uLm5ldyBTZXQoc2NvcGVzKV1cbiAgfSxcblxuICAvKipcbiAgICogUmVuYW1lIGEgc2NvcGUuXG4gICAqXG4gICAqIFJvbGVzIGFzc2lnbmVkIHdpdGggYSBnaXZlbiBzY29wZSBhcmUgY2hhbmdlZCB0byBiZSB1bmRlciB0aGUgbmV3IHNjb3BlLlxuICAgKlxuICAgKiBAbWV0aG9kIHJlbmFtZVNjb3BlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBvbGROYW1lIE9sZCBuYW1lIG9mIGEgc2NvcGUuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuZXdOYW1lIE5ldyBuYW1lIG9mIGEgc2NvcGUuXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIHJlbmFtZVNjb3BlOiBmdW5jdGlvbiAob2xkTmFtZSwgbmV3TmFtZSkge1xuICAgIGxldCBjb3VudFxuXG4gICAgUm9sZXMuX2NoZWNrU2NvcGVOYW1lKG9sZE5hbWUpXG4gICAgUm9sZXMuX2NoZWNrU2NvcGVOYW1lKG5ld05hbWUpXG5cbiAgICBpZiAob2xkTmFtZSA9PT0gbmV3TmFtZSkgcmV0dXJuXG5cbiAgICBkbyB7XG4gICAgICBjb3VudCA9IE1ldGVvci5yb2xlQXNzaWdubWVudC51cGRhdGUoe1xuICAgICAgICBzY29wZTogb2xkTmFtZVxuICAgICAgfSwge1xuICAgICAgICAkc2V0OiB7XG4gICAgICAgICAgc2NvcGU6IG5ld05hbWVcbiAgICAgICAgfVxuICAgICAgfSwgeyBtdWx0aTogdHJ1ZSB9KVxuICAgIH0gd2hpbGUgKGNvdW50ID4gMClcbiAgfSxcblxuICAvKipcbiAgICogUmVtb3ZlIGEgc2NvcGUuXG4gICAqXG4gICAqIFJvbGVzIGFzc2lnbmVkIHdpdGggYSBnaXZlbiBzY29wZSBhcmUgcmVtb3ZlZC5cbiAgICpcbiAgICogQG1ldGhvZCByZW1vdmVTY29wZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBUaGUgbmFtZSBvZiBhIHNjb3BlLlxuICAgKiBAc3RhdGljXG4gICAqL1xuICByZW1vdmVTY29wZTogZnVuY3Rpb24gKG5hbWUpIHtcbiAgICBSb2xlcy5fY2hlY2tTY29wZU5hbWUobmFtZSlcblxuICAgIE1ldGVvci5yb2xlQXNzaWdubWVudC5yZW1vdmUoeyBzY29wZTogbmFtZSB9KVxuICB9LFxuXG4gIC8qKlxuICAgKiBUaHJvdyBhbiBleGNlcHRpb24gaWYgYHJvbGVOYW1lYCBpcyBhbiBpbnZhbGlkIHJvbGUgbmFtZS5cbiAgICpcbiAgICogQG1ldGhvZCBfY2hlY2tSb2xlTmFtZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gcm9sZU5hbWUgQSByb2xlIG5hbWUgdG8gbWF0Y2ggYWdhaW5zdC5cbiAgICogQHByaXZhdGVcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgX2NoZWNrUm9sZU5hbWU6IGZ1bmN0aW9uIChyb2xlTmFtZSkge1xuICAgIGlmICghcm9sZU5hbWUgfHwgdHlwZW9mIHJvbGVOYW1lICE9PSAnc3RyaW5nJyB8fCByb2xlTmFtZS50cmltKCkgIT09IHJvbGVOYW1lKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgcm9sZSBuYW1lIFxcJycgKyByb2xlTmFtZSArICdcXCcuJylcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEZpbmQgb3V0IGlmIGEgcm9sZSBpcyBhbiBhbmNlc3RvciBvZiBhbm90aGVyIHJvbGUuXG4gICAqXG4gICAqIFdBUk5JTkc6IElmIHlvdSBjaGVjayB0aGlzIG9uIHRoZSBjbGllbnQsIHBsZWFzZSBtYWtlIHN1cmUgYWxsIHJvbGVzIGFyZSBwdWJsaXNoZWQuXG4gICAqXG4gICAqIEBtZXRob2QgaXNQYXJlbnRPZlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGFyZW50Um9sZU5hbWUgVGhlIHJvbGUgeW91IHdhbnQgdG8gcmVzZWFyY2guXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBjaGlsZFJvbGVOYW1lIFRoZSByb2xlIHlvdSBleHBlY3QgdG8gYmUgYW1vbmcgdGhlIGNoaWxkcmVuIG9mIHBhcmVudFJvbGVOYW1lLlxuICAgKiBAc3RhdGljXG4gICAqL1xuICBpc1BhcmVudE9mOiBmdW5jdGlvbiAocGFyZW50Um9sZU5hbWUsIGNoaWxkUm9sZU5hbWUpIHtcbiAgICBpZiAocGFyZW50Um9sZU5hbWUgPT09IGNoaWxkUm9sZU5hbWUpIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgaWYgKHBhcmVudFJvbGVOYW1lID09IG51bGwgfHwgY2hpbGRSb2xlTmFtZSA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICBSb2xlcy5fY2hlY2tSb2xlTmFtZShwYXJlbnRSb2xlTmFtZSlcbiAgICBSb2xlcy5fY2hlY2tSb2xlTmFtZShjaGlsZFJvbGVOYW1lKVxuXG4gICAgbGV0IHJvbGVzVG9DaGVjayA9IFtwYXJlbnRSb2xlTmFtZV1cbiAgICB3aGlsZSAocm9sZXNUb0NoZWNrLmxlbmd0aCAhPT0gMCkge1xuICAgICAgY29uc3Qgcm9sZU5hbWUgPSByb2xlc1RvQ2hlY2sucG9wKClcblxuICAgICAgaWYgKHJvbGVOYW1lID09PSBjaGlsZFJvbGVOYW1lKSB7XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJvbGUgPSBNZXRlb3Iucm9sZXMuZmluZE9uZSh7IF9pZDogcm9sZU5hbWUgfSlcblxuICAgICAgLy8gVGhpcyBzaG91bGQgbm90IGhhcHBlbiwgYnV0IHRoaXMgaXMgYSBwcm9ibGVtIHRvIGFkZHJlc3MgYXQgc29tZSBvdGhlciB0aW1lLlxuICAgICAgaWYgKCFyb2xlKSBjb250aW51ZVxuXG4gICAgICByb2xlc1RvQ2hlY2sgPSByb2xlc1RvQ2hlY2suY29uY2F0KHJvbGUuY2hpbGRyZW4ubWFwKHIgPT4gci5faWQpKVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZVxuICB9LFxuXG4gIC8qKlxuICAgKiBOb3JtYWxpemUgb3B0aW9ucy5cbiAgICpcbiAgICogQG1ldGhvZCBfbm9ybWFsaXplT3B0aW9uc1xuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBPcHRpb25zIHRvIG5vcm1hbGl6ZS5cbiAgICogQHJldHVybiB7T2JqZWN0fSBOb3JtYWxpemVkIG9wdGlvbnMuXG4gICAqIEBwcml2YXRlXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIF9ub3JtYWxpemVPcHRpb25zOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zID09PSB1bmRlZmluZWQgPyB7fSA6IG9wdGlvbnNcblxuICAgIGlmIChvcHRpb25zID09PSBudWxsIHx8IHR5cGVvZiBvcHRpb25zID09PSAnc3RyaW5nJykge1xuICAgICAgb3B0aW9ucyA9IHsgc2NvcGU6IG9wdGlvbnMgfVxuICAgIH1cblxuICAgIG9wdGlvbnMuc2NvcGUgPSBSb2xlcy5fbm9ybWFsaXplU2NvcGVOYW1lKG9wdGlvbnMuc2NvcGUpXG5cbiAgICByZXR1cm4gb3B0aW9uc1xuICB9LFxuXG4gIC8qKlxuICAgKiBOb3JtYWxpemUgc2NvcGUgbmFtZS5cbiAgICpcbiAgICogQG1ldGhvZCBfbm9ybWFsaXplU2NvcGVOYW1lXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzY29wZU5hbWUgQSBzY29wZSBuYW1lIHRvIG5vcm1hbGl6ZS5cbiAgICogQHJldHVybiB7U3RyaW5nfSBOb3JtYWxpemVkIHNjb3BlIG5hbWUuXG4gICAqIEBwcml2YXRlXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIF9ub3JtYWxpemVTY29wZU5hbWU6IGZ1bmN0aW9uIChzY29wZU5hbWUpIHtcbiAgICAvLyBtYXAgdW5kZWZpbmVkIGFuZCBudWxsIHRvIG51bGxcbiAgICBpZiAoc2NvcGVOYW1lID09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzY29wZU5hbWVcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIFRocm93IGFuIGV4Y2VwdGlvbiBpZiBgc2NvcGVOYW1lYCBpcyBhbiBpbnZhbGlkIHNjb3BlIG5hbWUuXG4gICAqXG4gICAqIEBtZXRob2QgX2NoZWNrUm9sZU5hbWVcbiAgICogQHBhcmFtIHtTdHJpbmd9IHNjb3BlTmFtZSBBIHNjb3BlIG5hbWUgdG8gbWF0Y2ggYWdhaW5zdC5cbiAgICogQHByaXZhdGVcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgX2NoZWNrU2NvcGVOYW1lOiBmdW5jdGlvbiAoc2NvcGVOYW1lKSB7XG4gICAgaWYgKHNjb3BlTmFtZSA9PT0gbnVsbCkgcmV0dXJuXG5cbiAgICBpZiAoIXNjb3BlTmFtZSB8fCB0eXBlb2Ygc2NvcGVOYW1lICE9PSAnc3RyaW5nJyB8fCBzY29wZU5hbWUudHJpbSgpICE9PSBzY29wZU5hbWUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzY29wZSBuYW1lIFxcJycgKyBzY29wZU5hbWUgKyAnXFwnLicpXG4gICAgfVxuICB9XG59KVxuIiwiLyogZ2xvYmFsIFJvbGVzICovXG5pbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJ1xuaW1wb3J0IHsgTW9uZ28gfSBmcm9tICdtZXRlb3IvbW9uZ28nXG5cbi8qKlxuICogUHJvdmlkZXMgZnVuY3Rpb25zIHJlbGF0ZWQgdG8gdXNlciBhdXRob3JpemF0aW9uLiBDb21wYXRpYmxlIHdpdGggYnVpbHQtaW4gTWV0ZW9yIGFjY291bnRzIHBhY2thZ2VzLlxuICpcbiAqIFJvbGVzIGFyZSBhY2Nlc3NpYmxlIHRocm9naCBgTWV0ZW9yLnJvbGVzYCBjb2xsZWN0aW9uIGFuZCBkb2N1bWVudHMgY29uc2lzdCBvZjpcbiAqICAtIGBfaWRgOiByb2xlIG5hbWVcbiAqICAtIGBjaGlsZHJlbmA6IGxpc3Qgb2Ygc3ViZG9jdW1lbnRzOlxuICogICAgLSBgX2lkYFxuICpcbiAqIENoaWxkcmVuIGxpc3QgZWxlbWVudHMgYXJlIHN1YmRvY3VtZW50cyBzbyB0aGF0IHRoZXkgY2FuIGJlIGVhc2llciBleHRlbmRlZCBpbiB0aGUgZnV0dXJlIG9yIGJ5IHBsdWdpbnMuXG4gKlxuICogUm9sZXMgY2FuIGhhdmUgbXVsdGlwbGUgcGFyZW50cyBhbmQgY2FuIGJlIGNoaWxkcmVuIChzdWJyb2xlcykgb2YgbXVsdGlwbGUgcm9sZXMuXG4gKlxuICogRXhhbXBsZTogYHtfaWQ6ICdhZG1pbicsIGNoaWxkcmVuOiBbe19pZDogJ2VkaXRvcid9XX1gXG4gKlxuICogVGhlIGFzc2lnbm1lbnQgb2YgYSByb2xlIHRvIGEgdXNlciBpcyBzdG9yZWQgaW4gYSBjb2xsZWN0aW9uLCBhY2Nlc3NpYmxlIHRocm91Z2ggYE1ldGVvci5yb2xlQXNzaWdubWVudGAuXG4gKiBJdCdzIGRvY3VtZW50cyBjb25zaXN0IG9mXG4gKiAgLSBgX2lkYDogSW50ZXJuYWwgTW9uZ29EQiBpZFxuICogIC0gYHJvbGVgOiBBIHJvbGUgb2JqZWN0IHdoaWNoIGdvdCBhc3NpZ25lZC4gVXN1YWxseSBvbmx5IGNvbnRhaW5zIHRoZSBgX2lkYCBwcm9wZXJ0eVxuICogIC0gYHVzZXJgOiBBIHVzZXIgb2JqZWN0LCB1c3VhbGx5IG9ubHkgY29udGFpbnMgdGhlIGBfaWRgIHByb3BlcnR5XG4gKiAgLSBgc2NvcGVgOiBzY29wZSBuYW1lXG4gKiAgLSBgaW5oZXJpdGVkUm9sZXNgOiBBIGxpc3Qgb2YgYWxsIHRoZSByb2xlcyBvYmplY3RzIGluaGVyaXRlZCBieSB0aGUgYXNzaWduZWQgcm9sZS5cbiAqXG4gKiBAbW9kdWxlIFJvbGVzXG4gKi9cbmlmICghTWV0ZW9yLnJvbGVzKSB7XG4gIE1ldGVvci5yb2xlcyA9IG5ldyBNb25nby5Db2xsZWN0aW9uKCdyb2xlcycpXG59XG5cbmlmICghTWV0ZW9yLnJvbGVBc3NpZ25tZW50KSB7XG4gIE1ldGVvci5yb2xlQXNzaWdubWVudCA9IG5ldyBNb25nby5Db2xsZWN0aW9uKCdyb2xlLWFzc2lnbm1lbnQnKVxufVxuXG4vKipcbiAqIEBjbGFzcyBSb2xlc1xuICovXG5pZiAodHlwZW9mIFJvbGVzID09PSAndW5kZWZpbmVkJykge1xuICBSb2xlcyA9IHt9IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tZ2xvYmFsLWFzc2lnblxufVxuXG5sZXQgZ2V0R3JvdXBzRm9yVXNlckRlcHJlY2F0aW9uV2FybmluZyA9IGZhbHNlXG5cbi8qKlxuICogSGVscGVyLCByZXNvbHZlcyBhc3luYyBzb21lXG4gKiBAcGFyYW0geyp9IGFyclxuICogQHBhcmFtIHsqfSBwcmVkaWNhdGVcbiAqIEByZXR1cm5zIHtQcm9taXNlPEJvb2xlYW4+fVxuICovXG5jb25zdCBhc3luY1NvbWUgPSBhc3luYyAoYXJyLCBwcmVkaWNhdGUpID0+IHtcbiAgZm9yIChjb25zdCBlIG9mIGFycikge1xuICAgIGlmIChhd2FpdCBwcmVkaWNhdGUoZSkpIHJldHVybiB0cnVlXG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbk9iamVjdC5hc3NpZ24oUm9sZXMsIHtcbiAgLyoqXG4gICAqIFVzZWQgYXMgYSBnbG9iYWwgZ3JvdXAgKG5vdyBzY29wZSkgbmFtZS4gTm90IHVzZWQgYW55bW9yZS5cbiAgICpcbiAgICogQHByb3BlcnR5IEdMT0JBTF9HUk9VUFxuICAgKiBAc3RhdGljXG4gICAqIEBkZXByZWNhdGVkXG4gICAqL1xuICBHTE9CQUxfR1JPVVA6IG51bGwsXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyByb2xlLlxuICAgKlxuICAgKiBAbWV0aG9kIGNyZWF0ZVJvbGVBc3luY1xuICAgKiBAcGFyYW0ge1N0cmluZ30gcm9sZU5hbWUgTmFtZSBvZiByb2xlLlxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIE9wdGlvbnM6XG4gICAqICAgLSBgdW5sZXNzRXhpc3RzYDogaWYgYHRydWVgLCBleGNlcHRpb24gd2lsbCBub3QgYmUgdGhyb3duIGluIHRoZSByb2xlIGFscmVhZHkgZXhpc3RzXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U3RyaW5nPn0gSUQgb2YgdGhlIG5ldyByb2xlIG9yIG51bGwuXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIGNyZWF0ZVJvbGVBc3luYzogYXN5bmMgZnVuY3Rpb24gKHJvbGVOYW1lLCBvcHRpb25zKSB7XG4gICAgUm9sZXMuX2NoZWNrUm9sZU5hbWUocm9sZU5hbWUpXG5cbiAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHtcbiAgICAgICAgdW5sZXNzRXhpc3RzOiBmYWxzZVxuICAgICAgfSxcbiAgICAgIG9wdGlvbnNcbiAgICApXG5cbiAgICBsZXQgaW5zZXJ0ZWRJZCA9IG51bGxcblxuICAgIGNvbnN0IGV4aXN0aW5nUm9sZSA9IGF3YWl0IE1ldGVvci5yb2xlcy5maW5kT25lQXN5bmMoeyBfaWQ6IHJvbGVOYW1lIH0pXG5cbiAgICBpZiAoZXhpc3RpbmdSb2xlKSB7XG4gICAgICBhd2FpdCBNZXRlb3Iucm9sZXMudXBkYXRlQXN5bmMoXG4gICAgICAgIHsgX2lkOiByb2xlTmFtZSB9LFxuICAgICAgICB7ICRzZXRPbkluc2VydDogeyBjaGlsZHJlbjogW10gfSB9XG4gICAgICApXG4gICAgICByZXR1cm4gbnVsbFxuICAgIH0gZWxzZSB7XG4gICAgICBpbnNlcnRlZElkID0gYXdhaXQgTWV0ZW9yLnJvbGVzLmluc2VydEFzeW5jKHtcbiAgICAgICAgX2lkOiByb2xlTmFtZSxcbiAgICAgICAgY2hpbGRyZW46IFtdXG4gICAgICB9KVxuICAgIH1cblxuICAgIGlmICghaW5zZXJ0ZWRJZCkge1xuICAgICAgaWYgKG9wdGlvbnMudW5sZXNzRXhpc3RzKSByZXR1cm4gbnVsbFxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUm9sZSAnXCIgKyByb2xlTmFtZSArIFwiJyBhbHJlYWR5IGV4aXN0cy5cIilcbiAgICB9XG5cbiAgICByZXR1cm4gaW5zZXJ0ZWRJZFxuICB9LFxuXG4gIC8qKlxuICAgKiBEZWxldGUgYW4gZXhpc3Rpbmcgcm9sZS5cbiAgICpcbiAgICogSWYgdGhlIHJvbGUgaXMgc2V0IGZvciBhbnkgdXNlciwgaXQgaXMgYXV0b21hdGljYWxseSB1bnNldC5cbiAgICpcbiAgICogQG1ldGhvZCBkZWxldGVSb2xlQXN5bmNcbiAgICogQHBhcmFtIHtTdHJpbmd9IHJvbGVOYW1lIE5hbWUgb2Ygcm9sZS5cbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqIEBzdGF0aWNcbiAgICovXG4gIGRlbGV0ZVJvbGVBc3luYzogYXN5bmMgZnVuY3Rpb24gKHJvbGVOYW1lKSB7XG4gICAgbGV0IHJvbGVzXG4gICAgbGV0IGluaGVyaXRlZFJvbGVzXG5cbiAgICBSb2xlcy5fY2hlY2tSb2xlTmFtZShyb2xlTmFtZSlcblxuICAgIC8vIFJlbW92ZSBhbGwgYXNzaWdubWVudHNcbiAgICBhd2FpdCBNZXRlb3Iucm9sZUFzc2lnbm1lbnQucmVtb3ZlQXN5bmMoe1xuICAgICAgJ3JvbGUuX2lkJzogcm9sZU5hbWVcbiAgICB9KVxuXG4gICAgZG8ge1xuICAgICAgLy8gRm9yIGFsbCByb2xlcyB3aG8gaGF2ZSBpdCBhcyBhIGRlcGVuZGVuY3kgLi4uXG4gICAgICByb2xlcyA9IFJvbGVzLl9nZXRQYXJlbnRSb2xlTmFtZXMoXG4gICAgICAgIGF3YWl0IE1ldGVvci5yb2xlcy5maW5kT25lQXN5bmMoeyBfaWQ6IHJvbGVOYW1lIH0pXG4gICAgICApXG5cbiAgICAgIGZvciAoY29uc3QgciBvZiBhd2FpdCBNZXRlb3Iucm9sZXNcbiAgICAgICAgLmZpbmQoeyBfaWQ6IHsgJGluOiByb2xlcyB9IH0pXG4gICAgICAgIC5mZXRjaEFzeW5jKCkpIHtcbiAgICAgICAgYXdhaXQgTWV0ZW9yLnJvbGVzLnVwZGF0ZUFzeW5jKFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIF9pZDogci5faWRcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgICRwdWxsOiB7XG4gICAgICAgICAgICAgIGNoaWxkcmVuOiB7XG4gICAgICAgICAgICAgICAgX2lkOiByb2xlTmFtZVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICApXG5cbiAgICAgICAgaW5oZXJpdGVkUm9sZXMgPSBhd2FpdCBSb2xlcy5fZ2V0SW5oZXJpdGVkUm9sZU5hbWVzQXN5bmMoXG4gICAgICAgICAgYXdhaXQgTWV0ZW9yLnJvbGVzLmZpbmRPbmVBc3luYyh7IF9pZDogci5faWQgfSlcbiAgICAgICAgKVxuICAgICAgICBhd2FpdCBNZXRlb3Iucm9sZUFzc2lnbm1lbnQudXBkYXRlQXN5bmMoXG4gICAgICAgICAge1xuICAgICAgICAgICAgJ3JvbGUuX2lkJzogci5faWRcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgICRzZXQ6IHtcbiAgICAgICAgICAgICAgaW5oZXJpdGVkUm9sZXM6IFtyLl9pZCwgLi4uaW5oZXJpdGVkUm9sZXNdLm1hcCgocjIpID0+ICh7XG4gICAgICAgICAgICAgICAgX2lkOiByMlxuICAgICAgICAgICAgICB9KSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIHsgbXVsdGk6IHRydWUgfVxuICAgICAgICApXG4gICAgICB9XG4gICAgfSB3aGlsZSAocm9sZXMubGVuZ3RoID4gMClcblxuICAgIC8vIEFuZCBmaW5hbGx5IHJlbW92ZSB0aGUgcm9sZSBpdHNlbGZcbiAgICBhd2FpdCBNZXRlb3Iucm9sZXMucmVtb3ZlQXN5bmMoeyBfaWQ6IHJvbGVOYW1lIH0pXG4gIH0sXG5cbiAgLyoqXG4gICAqIFJlbmFtZSBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAbWV0aG9kIHJlbmFtZVJvbGVBc3luY1xuICAgKiBAcGFyYW0ge1N0cmluZ30gb2xkTmFtZSBPbGQgbmFtZSBvZiBhIHJvbGUuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuZXdOYW1lIE5ldyBuYW1lIG9mIGEgcm9sZS5cbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqIEBzdGF0aWNcbiAgICovXG4gIHJlbmFtZVJvbGVBc3luYzogYXN5bmMgZnVuY3Rpb24gKG9sZE5hbWUsIG5ld05hbWUpIHtcbiAgICBsZXQgY291bnRcblxuICAgIFJvbGVzLl9jaGVja1JvbGVOYW1lKG9sZE5hbWUpXG4gICAgUm9sZXMuX2NoZWNrUm9sZU5hbWUobmV3TmFtZSlcblxuICAgIGlmIChvbGROYW1lID09PSBuZXdOYW1lKSByZXR1cm5cblxuICAgIGNvbnN0IHJvbGUgPSBhd2FpdCBNZXRlb3Iucm9sZXMuZmluZE9uZUFzeW5jKHsgX2lkOiBvbGROYW1lIH0pXG5cbiAgICBpZiAoIXJvbGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlJvbGUgJ1wiICsgb2xkTmFtZSArIFwiJyBkb2VzIG5vdCBleGlzdC5cIilcbiAgICB9XG5cbiAgICByb2xlLl9pZCA9IG5ld05hbWVcblxuICAgIGF3YWl0IE1ldGVvci5yb2xlcy5pbnNlcnRBc3luYyhyb2xlKVxuXG4gICAgZG8ge1xuICAgICAgY291bnQgPSBhd2FpdCBNZXRlb3Iucm9sZUFzc2lnbm1lbnQudXBkYXRlQXN5bmMoXG4gICAgICAgIHtcbiAgICAgICAgICAncm9sZS5faWQnOiBvbGROYW1lXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAkc2V0OiB7XG4gICAgICAgICAgICAncm9sZS5faWQnOiBuZXdOYW1lXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB7IG11bHRpOiB0cnVlIH1cbiAgICAgIClcbiAgICB9IHdoaWxlIChjb3VudCA+IDApXG5cbiAgICBkbyB7XG4gICAgICBjb3VudCA9IGF3YWl0IE1ldGVvci5yb2xlQXNzaWdubWVudC51cGRhdGVBc3luYyhcbiAgICAgICAge1xuICAgICAgICAgICdpbmhlcml0ZWRSb2xlcy5faWQnOiBvbGROYW1lXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAkc2V0OiB7XG4gICAgICAgICAgICAnaW5oZXJpdGVkUm9sZXMuJC5faWQnOiBuZXdOYW1lXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB7IG11bHRpOiB0cnVlIH1cbiAgICAgIClcbiAgICB9IHdoaWxlIChjb3VudCA+IDApXG5cbiAgICBkbyB7XG4gICAgICBjb3VudCA9IGF3YWl0IE1ldGVvci5yb2xlcy51cGRhdGVBc3luYyhcbiAgICAgICAge1xuICAgICAgICAgICdjaGlsZHJlbi5faWQnOiBvbGROYW1lXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAkc2V0OiB7XG4gICAgICAgICAgICAnY2hpbGRyZW4uJC5faWQnOiBuZXdOYW1lXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB7IG11bHRpOiB0cnVlIH1cbiAgICAgIClcbiAgICB9IHdoaWxlIChjb3VudCA+IDApXG5cbiAgICBhd2FpdCBNZXRlb3Iucm9sZXMucmVtb3ZlQXN5bmMoeyBfaWQ6IG9sZE5hbWUgfSlcbiAgfSxcblxuICAvKipcbiAgICogQWRkIHJvbGUgcGFyZW50IHRvIHJvbGVzLlxuICAgKlxuICAgKiBQcmV2aW91cyBwYXJlbnRzIGFyZSBrZXB0IChyb2xlIGNhbiBoYXZlIG11bHRpcGxlIHBhcmVudHMpLiBGb3IgdXNlcnMgd2hpY2ggaGF2ZSB0aGVcbiAgICogcGFyZW50IHJvbGUgc2V0LCBuZXcgc3Vicm9sZXMgYXJlIGFkZGVkIGF1dG9tYXRpY2FsbHkuXG4gICAqXG4gICAqIEBtZXRob2QgYWRkUm9sZXNUb1BhcmVudEFzeW5jXG4gICAqIEBwYXJhbSB7QXJyYXl8U3RyaW5nfSByb2xlc05hbWVzIE5hbWUocykgb2Ygcm9sZShzKS5cbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhcmVudE5hbWUgTmFtZSBvZiBwYXJlbnQgcm9sZS5cbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqIEBzdGF0aWNcbiAgICovXG4gIGFkZFJvbGVzVG9QYXJlbnRBc3luYzogYXN5bmMgZnVuY3Rpb24gKHJvbGVzTmFtZXMsIHBhcmVudE5hbWUpIHtcbiAgICAvLyBlbnN1cmUgYXJyYXlzXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHJvbGVzTmFtZXMpKSByb2xlc05hbWVzID0gW3JvbGVzTmFtZXNdXG5cbiAgICBmb3IgKGNvbnN0IHJvbGVOYW1lIG9mIHJvbGVzTmFtZXMpIHtcbiAgICAgIGF3YWl0IFJvbGVzLl9hZGRSb2xlVG9QYXJlbnRBc3luYyhyb2xlTmFtZSwgcGFyZW50TmFtZSlcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBtZXRob2QgX2FkZFJvbGVUb1BhcmVudEFzeW5jXG4gICAqIEBwYXJhbSB7U3RyaW5nfSByb2xlTmFtZSBOYW1lIG9mIHJvbGUuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXJlbnROYW1lIE5hbWUgb2YgcGFyZW50IHJvbGUuXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKiBAcHJpdmF0ZVxuICAgKiBAc3RhdGljXG4gICAqL1xuICBfYWRkUm9sZVRvUGFyZW50QXN5bmM6IGFzeW5jIGZ1bmN0aW9uIChyb2xlTmFtZSwgcGFyZW50TmFtZSkge1xuICAgIFJvbGVzLl9jaGVja1JvbGVOYW1lKHJvbGVOYW1lKVxuICAgIFJvbGVzLl9jaGVja1JvbGVOYW1lKHBhcmVudE5hbWUpXG5cbiAgICAvLyBxdWVyeSB0byBnZXQgcm9sZSdzIGNoaWxkcmVuXG4gICAgY29uc3Qgcm9sZSA9IGF3YWl0IE1ldGVvci5yb2xlcy5maW5kT25lQXN5bmMoeyBfaWQ6IHJvbGVOYW1lIH0pXG5cbiAgICBpZiAoIXJvbGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlJvbGUgJ1wiICsgcm9sZU5hbWUgKyBcIicgZG9lcyBub3QgZXhpc3QuXCIpXG4gICAgfVxuXG4gICAgLy8gZGV0ZWN0IGN5Y2xlc1xuICAgIGlmICgoYXdhaXQgUm9sZXMuX2dldEluaGVyaXRlZFJvbGVOYW1lc0FzeW5jKHJvbGUpKS5pbmNsdWRlcyhwYXJlbnROYW1lKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBcIlJvbGVzICdcIiArIHJvbGVOYW1lICsgXCInIGFuZCAnXCIgKyBwYXJlbnROYW1lICsgXCInIHdvdWxkIGZvcm0gYSBjeWNsZS5cIlxuICAgICAgKVxuICAgIH1cblxuICAgIGNvbnN0IGNvdW50ID0gYXdhaXQgTWV0ZW9yLnJvbGVzLnVwZGF0ZUFzeW5jKFxuICAgICAge1xuICAgICAgICBfaWQ6IHBhcmVudE5hbWUsXG4gICAgICAgICdjaGlsZHJlbi5faWQnOiB7XG4gICAgICAgICAgJG5lOiByb2xlLl9pZFxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICAkcHVzaDoge1xuICAgICAgICAgIGNoaWxkcmVuOiB7XG4gICAgICAgICAgICBfaWQ6IHJvbGUuX2lkXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgKVxuXG4gICAgLy8gaWYgdGhlcmUgd2FzIG5vIGNoYW5nZSwgcGFyZW50IHJvbGUgbWlnaHQgbm90IGV4aXN0LCBvciByb2xlIGlzXG4gICAgLy8gYWxyZWFkeSBhIHN1Yi1yb2xlOyBpbiBhbnkgY2FzZSB3ZSBkbyBub3QgaGF2ZSBhbnl0aGluZyBtb3JlIHRvIGRvXG4gICAgaWYgKCFjb3VudCkgcmV0dXJuXG5cbiAgICBhd2FpdCBNZXRlb3Iucm9sZUFzc2lnbm1lbnQudXBkYXRlQXN5bmMoXG4gICAgICB7XG4gICAgICAgICdpbmhlcml0ZWRSb2xlcy5faWQnOiBwYXJlbnROYW1lXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICAkcHVzaDoge1xuICAgICAgICAgIGluaGVyaXRlZFJvbGVzOiB7XG4gICAgICAgICAgICAkZWFjaDogW1xuICAgICAgICAgICAgICByb2xlLl9pZCxcbiAgICAgICAgICAgICAgLi4uKGF3YWl0IFJvbGVzLl9nZXRJbmhlcml0ZWRSb2xlTmFtZXNBc3luYyhyb2xlKSlcbiAgICAgICAgICAgIF0ubWFwKChyKSA9PiAoeyBfaWQ6IHIgfSkpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgeyBtdWx0aTogdHJ1ZSB9XG4gICAgKVxuICB9LFxuXG4gIC8qKlxuICAgKiBSZW1vdmUgcm9sZSBwYXJlbnQgZnJvbSByb2xlcy5cbiAgICpcbiAgICogT3RoZXIgcGFyZW50cyBhcmUga2VwdCAocm9sZSBjYW4gaGF2ZSBtdWx0aXBsZSBwYXJlbnRzKS4gRm9yIHVzZXJzIHdoaWNoIGhhdmUgdGhlXG4gICAqIHBhcmVudCByb2xlIHNldCwgcmVtb3ZlZCBzdWJyb2xlIGlzIHJlbW92ZWQgYXV0b21hdGljYWxseS5cbiAgICpcbiAgICogQG1ldGhvZCByZW1vdmVSb2xlc0Zyb21QYXJlbnRBc3luY1xuICAgKiBAcGFyYW0ge0FycmF5fFN0cmluZ30gcm9sZXNOYW1lcyBOYW1lKHMpIG9mIHJvbGUocykuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXJlbnROYW1lIE5hbWUgb2YgcGFyZW50IHJvbGUuXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKiBAc3RhdGljXG4gICAqL1xuICByZW1vdmVSb2xlc0Zyb21QYXJlbnRBc3luYzogYXN5bmMgZnVuY3Rpb24gKHJvbGVzTmFtZXMsIHBhcmVudE5hbWUpIHtcbiAgICAvLyBlbnN1cmUgYXJyYXlzXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHJvbGVzTmFtZXMpKSByb2xlc05hbWVzID0gW3JvbGVzTmFtZXNdXG5cbiAgICBmb3IgKGNvbnN0IHJvbGVOYW1lIG9mIHJvbGVzTmFtZXMpIHtcbiAgICAgIGF3YWl0IFJvbGVzLl9yZW1vdmVSb2xlRnJvbVBhcmVudEFzeW5jKHJvbGVOYW1lLCBwYXJlbnROYW1lKVxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogQG1ldGhvZCBfcmVtb3ZlUm9sZUZyb21QYXJlbnRBc3luY1xuICAgKiBAcGFyYW0ge1N0cmluZ30gcm9sZU5hbWUgTmFtZSBvZiByb2xlLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGFyZW50TmFtZSBOYW1lIG9mIHBhcmVudCByb2xlLlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICogQHByaXZhdGVcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgX3JlbW92ZVJvbGVGcm9tUGFyZW50QXN5bmM6IGFzeW5jIGZ1bmN0aW9uIChyb2xlTmFtZSwgcGFyZW50TmFtZSkge1xuICAgIFJvbGVzLl9jaGVja1JvbGVOYW1lKHJvbGVOYW1lKVxuICAgIFJvbGVzLl9jaGVja1JvbGVOYW1lKHBhcmVudE5hbWUpXG5cbiAgICAvLyBjaGVjayBmb3Igcm9sZSBleGlzdGVuY2VcbiAgICAvLyB0aGlzIHdvdWxkIG5vdCByZWFsbHkgYmUgbmVlZGVkLCBidXQgd2UgYXJlIHRyeWluZyB0byBtYXRjaCBhZGRSb2xlc1RvUGFyZW50XG4gICAgY29uc3Qgcm9sZSA9IGF3YWl0IE1ldGVvci5yb2xlcy5maW5kT25lQXN5bmMoXG4gICAgICB7IF9pZDogcm9sZU5hbWUgfSxcbiAgICAgIHsgZmllbGRzOiB7IF9pZDogMSB9IH1cbiAgICApXG5cbiAgICBpZiAoIXJvbGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlJvbGUgJ1wiICsgcm9sZU5hbWUgKyBcIicgZG9lcyBub3QgZXhpc3QuXCIpXG4gICAgfVxuXG4gICAgY29uc3QgY291bnQgPSBhd2FpdCBNZXRlb3Iucm9sZXMudXBkYXRlQXN5bmMoXG4gICAgICB7XG4gICAgICAgIF9pZDogcGFyZW50TmFtZVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgJHB1bGw6IHtcbiAgICAgICAgICBjaGlsZHJlbjoge1xuICAgICAgICAgICAgX2lkOiByb2xlLl9pZFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIClcblxuICAgIC8vIGlmIHRoZXJlIHdhcyBubyBjaGFuZ2UsIHBhcmVudCByb2xlIG1pZ2h0IG5vdCBleGlzdCwgb3Igcm9sZSB3YXNcbiAgICAvLyBhbHJlYWR5IG5vdCBhIHN1YnJvbGU7IGluIGFueSBjYXNlIHdlIGRvIG5vdCBoYXZlIGFueXRoaW5nIG1vcmUgdG8gZG9cbiAgICBpZiAoIWNvdW50KSByZXR1cm5cblxuICAgIC8vIEZvciBhbGwgcm9sZXMgd2hvIGhhdmUgaGFkIGl0IGFzIGEgZGVwZW5kZW5jeSAuLi5cbiAgICBjb25zdCByb2xlcyA9IFtcbiAgICAgIC4uLihhd2FpdCBSb2xlcy5fZ2V0UGFyZW50Um9sZU5hbWVzQXN5bmMoXG4gICAgICAgIGF3YWl0IE1ldGVvci5yb2xlcy5maW5kT25lQXN5bmMoeyBfaWQ6IHBhcmVudE5hbWUgfSlcbiAgICAgICkpLFxuICAgICAgcGFyZW50TmFtZVxuICAgIF1cblxuICAgIGZvciAoY29uc3QgciBvZiBhd2FpdCBNZXRlb3Iucm9sZXNcbiAgICAgIC5maW5kKHsgX2lkOiB7ICRpbjogcm9sZXMgfSB9KVxuICAgICAgLmZldGNoQXN5bmMoKSkge1xuICAgICAgY29uc3QgaW5oZXJpdGVkUm9sZXMgPSBhd2FpdCBSb2xlcy5fZ2V0SW5oZXJpdGVkUm9sZU5hbWVzQXN5bmMoXG4gICAgICAgIGF3YWl0IE1ldGVvci5yb2xlcy5maW5kT25lQXN5bmMoeyBfaWQ6IHIuX2lkIH0pXG4gICAgICApXG4gICAgICBhd2FpdCBNZXRlb3Iucm9sZUFzc2lnbm1lbnQudXBkYXRlQXN5bmMoXG4gICAgICAgIHtcbiAgICAgICAgICAncm9sZS5faWQnOiByLl9pZCxcbiAgICAgICAgICAnaW5oZXJpdGVkUm9sZXMuX2lkJzogcm9sZS5faWRcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICRzZXQ6IHtcbiAgICAgICAgICAgIGluaGVyaXRlZFJvbGVzOiBbci5faWQsIC4uLmluaGVyaXRlZFJvbGVzXS5tYXAoKHIyKSA9PiAoe1xuICAgICAgICAgICAgICBfaWQ6IHIyXG4gICAgICAgICAgICB9KSlcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHsgbXVsdGk6IHRydWUgfVxuICAgICAgKVxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogQWRkIHVzZXJzIHRvIHJvbGVzLlxuICAgKlxuICAgKiBBZGRzIHJvbGVzIHRvIGV4aXN0aW5nIHJvbGVzIGZvciBlYWNoIHVzZXIuXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqICAgICBSb2xlcy5hZGRVc2Vyc1RvUm9sZXNBc3luYyh1c2VySWQsICdhZG1pbicpXG4gICAqICAgICBSb2xlcy5hZGRVc2Vyc1RvUm9sZXNBc3luYyh1c2VySWQsIFsndmlldy1zZWNyZXRzJ10sICdleGFtcGxlLmNvbScpXG4gICAqICAgICBSb2xlcy5hZGRVc2Vyc1RvUm9sZXNBc3luYyhbdXNlcjEsIHVzZXIyXSwgWyd1c2VyJywnZWRpdG9yJ10pXG4gICAqICAgICBSb2xlcy5hZGRVc2Vyc1RvUm9sZXNBc3luYyhbdXNlcjEsIHVzZXIyXSwgWydnbG9yaW91cy1hZG1pbicsICdwZXJmb3JtLWFjdGlvbiddLCAnZXhhbXBsZS5vcmcnKVxuICAgKlxuICAgKiBAbWV0aG9kIGFkZFVzZXJzVG9Sb2xlc0FzeW5jXG4gICAqIEBwYXJhbSB7QXJyYXl8U3RyaW5nfSB1c2VycyBVc2VyIElEKHMpIG9yIG9iamVjdChzKSB3aXRoIGFuIGBfaWRgIGZpZWxkLlxuICAgKiBAcGFyYW0ge0FycmF5fFN0cmluZ30gcm9sZXMgTmFtZShzKSBvZiByb2xlcyB0byBhZGQgdXNlcnMgdG8uIFJvbGVzIGhhdmUgdG8gZXhpc3QuXG4gICAqIEBwYXJhbSB7T2JqZWN0fFN0cmluZ30gW29wdGlvbnNdIE9wdGlvbnM6XG4gICAqICAgLSBgc2NvcGVgOiBuYW1lIG9mIHRoZSBzY29wZSwgb3IgYG51bGxgIGZvciB0aGUgZ2xvYmFsIHJvbGVcbiAgICogICAtIGBpZkV4aXN0c2A6IGlmIGB0cnVlYCwgZG8gbm90IHRocm93IGFuIGV4Y2VwdGlvbiBpZiB0aGUgcm9sZSBkb2VzIG5vdCBleGlzdFxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICpcbiAgICogQWx0ZXJuYXRpdmVseSwgaXQgY2FuIGJlIGEgc2NvcGUgbmFtZSBzdHJpbmcuXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIGFkZFVzZXJzVG9Sb2xlc0FzeW5jOiBhc3luYyBmdW5jdGlvbiAodXNlcnMsIHJvbGVzLCBvcHRpb25zKSB7XG4gICAgbGV0IGlkXG5cbiAgICBpZiAoIXVzZXJzKSB0aHJvdyBuZXcgRXJyb3IoXCJNaXNzaW5nICd1c2VycycgcGFyYW0uXCIpXG4gICAgaWYgKCFyb2xlcykgdGhyb3cgbmV3IEVycm9yKFwiTWlzc2luZyAncm9sZXMnIHBhcmFtLlwiKVxuXG4gICAgb3B0aW9ucyA9IFJvbGVzLl9ub3JtYWxpemVPcHRpb25zKG9wdGlvbnMpXG5cbiAgICAvLyBlbnN1cmUgYXJyYXlzXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHVzZXJzKSkgdXNlcnMgPSBbdXNlcnNdXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHJvbGVzKSkgcm9sZXMgPSBbcm9sZXNdXG5cbiAgICBSb2xlcy5fY2hlY2tTY29wZU5hbWUob3B0aW9ucy5zY29wZSlcblxuICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge1xuICAgICAgICBpZkV4aXN0czogZmFsc2VcbiAgICAgIH0sXG4gICAgICBvcHRpb25zXG4gICAgKVxuXG4gICAgZm9yIChjb25zdCB1c2VyIG9mIHVzZXJzKSB7XG4gICAgICBpZiAodHlwZW9mIHVzZXIgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIGlkID0gdXNlci5faWRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gdXNlclxuICAgICAgfVxuXG4gICAgICBmb3IgKGNvbnN0IHJvbGUgb2Ygcm9sZXMpIHtcbiAgICAgICAgYXdhaXQgUm9sZXMuX2FkZFVzZXJUb1JvbGVBc3luYyhpZCwgcm9sZSwgb3B0aW9ucylcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIFNldCB1c2Vycycgcm9sZXMuXG4gICAqXG4gICAqIFJlcGxhY2VzIGFsbCBleGlzdGluZyByb2xlcyB3aXRoIGEgbmV3IHNldCBvZiByb2xlcy5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogICAgIGF3YWl0IFJvbGVzLnNldFVzZXJSb2xlc0FzeW5jKHVzZXJJZCwgJ2FkbWluJylcbiAgICogICAgIGF3YWl0IFJvbGVzLnNldFVzZXJSb2xlc0FzeW5jKHVzZXJJZCwgWyd2aWV3LXNlY3JldHMnXSwgJ2V4YW1wbGUuY29tJylcbiAgICogICAgIGF3YWl0IFJvbGVzLnNldFVzZXJSb2xlc0FzeW5jKFt1c2VyMSwgdXNlcjJdLCBbJ3VzZXInLCdlZGl0b3InXSlcbiAgICogICAgIGF3YWl0IFJvbGVzLnNldFVzZXJSb2xlc0FzeW5jKFt1c2VyMSwgdXNlcjJdLCBbJ2dsb3Jpb3VzLWFkbWluJywgJ3BlcmZvcm0tYWN0aW9uJ10sICdleGFtcGxlLm9yZycpXG4gICAqXG4gICAqIEBtZXRob2Qgc2V0VXNlclJvbGVzQXN5bmNcbiAgICogQHBhcmFtIHtBcnJheXxTdHJpbmd9IHVzZXJzIFVzZXIgSUQocykgb3Igb2JqZWN0KHMpIHdpdGggYW4gYF9pZGAgZmllbGQuXG4gICAqIEBwYXJhbSB7QXJyYXl8U3RyaW5nfSByb2xlcyBOYW1lKHMpIG9mIHJvbGVzIHRvIGFkZCB1c2VycyB0by4gUm9sZXMgaGF2ZSB0byBleGlzdC5cbiAgICogQHBhcmFtIHtPYmplY3R8U3RyaW5nfSBbb3B0aW9uc10gT3B0aW9uczpcbiAgICogICAtIGBzY29wZWA6IG5hbWUgb2YgdGhlIHNjb3BlLCBvciBgbnVsbGAgZm9yIHRoZSBnbG9iYWwgcm9sZVxuICAgKiAgIC0gYGFueVNjb3BlYDogaWYgYHRydWVgLCByZW1vdmUgYWxsIHJvbGVzIHRoZSB1c2VyIGhhcywgb2YgYW55IHNjb3BlLCBpZiBgZmFsc2VgLCBvbmx5IHRoZSBvbmUgaW4gdGhlIHNhbWUgc2NvcGVcbiAgICogICAtIGBpZkV4aXN0c2A6IGlmIGB0cnVlYCwgZG8gbm90IHRocm93IGFuIGV4Y2VwdGlvbiBpZiB0aGUgcm9sZSBkb2VzIG5vdCBleGlzdFxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICpcbiAgICogQWx0ZXJuYXRpdmVseSwgaXQgY2FuIGJlIGEgc2NvcGUgbmFtZSBzdHJpbmcuXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIHNldFVzZXJSb2xlc0FzeW5jOiBhc3luYyBmdW5jdGlvbiAodXNlcnMsIHJvbGVzLCBvcHRpb25zKSB7XG4gICAgbGV0IGlkXG5cbiAgICBpZiAoIXVzZXJzKSB0aHJvdyBuZXcgRXJyb3IoXCJNaXNzaW5nICd1c2VycycgcGFyYW0uXCIpXG4gICAgaWYgKCFyb2xlcykgdGhyb3cgbmV3IEVycm9yKFwiTWlzc2luZyAncm9sZXMnIHBhcmFtLlwiKVxuXG4gICAgb3B0aW9ucyA9IFJvbGVzLl9ub3JtYWxpemVPcHRpb25zKG9wdGlvbnMpXG5cbiAgICAvLyBlbnN1cmUgYXJyYXlzXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHVzZXJzKSkgdXNlcnMgPSBbdXNlcnNdXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHJvbGVzKSkgcm9sZXMgPSBbcm9sZXNdXG5cbiAgICBSb2xlcy5fY2hlY2tTY29wZU5hbWUob3B0aW9ucy5zY29wZSlcblxuICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge1xuICAgICAgICBpZkV4aXN0czogZmFsc2UsXG4gICAgICAgIGFueVNjb3BlOiBmYWxzZVxuICAgICAgfSxcbiAgICAgIG9wdGlvbnNcbiAgICApXG5cbiAgICBmb3IgKGNvbnN0IHVzZXIgb2YgdXNlcnMpIHtcbiAgICAgIGlmICh0eXBlb2YgdXNlciA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgaWQgPSB1c2VyLl9pZFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWQgPSB1c2VyXG4gICAgICB9XG4gICAgICAvLyB3ZSBmaXJzdCBjbGVhciBhbGwgcm9sZXMgZm9yIHRoZSB1c2VyXG4gICAgICBjb25zdCBzZWxlY3RvciA9IHsgJ3VzZXIuX2lkJzogaWQgfVxuICAgICAgaWYgKCFvcHRpb25zLmFueVNjb3BlKSB7XG4gICAgICAgIHNlbGVjdG9yLnNjb3BlID0gb3B0aW9ucy5zY29wZVxuICAgICAgfVxuXG4gICAgICBhd2FpdCBNZXRlb3Iucm9sZUFzc2lnbm1lbnQucmVtb3ZlQXN5bmMoc2VsZWN0b3IpXG5cbiAgICAgIC8vIGFuZCB0aGVuIGFkZCBhbGxcbiAgICAgIGZvciAoY29uc3Qgcm9sZSBvZiByb2xlcykge1xuICAgICAgICBhd2FpdCBSb2xlcy5fYWRkVXNlclRvUm9sZShpZCwgcm9sZSwgb3B0aW9ucylcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEFkZCBvbmUgdXNlciB0byBvbmUgcm9sZS5cbiAgICpcbiAgICogQG1ldGhvZCBfYWRkVXNlclRvUm9sZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gdXNlcklkIFRoZSB1c2VyIElELlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcm9sZU5hbWUgTmFtZSBvZiB0aGUgcm9sZSB0byBhZGQgdGhlIHVzZXIgdG8uIFRoZSByb2xlIGhhdmUgdG8gZXhpc3QuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIE9wdGlvbnM6XG4gICAqICAgLSBgc2NvcGVgOiBuYW1lIG9mIHRoZSBzY29wZSwgb3IgYG51bGxgIGZvciB0aGUgZ2xvYmFsIHJvbGVcbiAgICogICAtIGBpZkV4aXN0c2A6IGlmIGB0cnVlYCwgZG8gbm90IHRocm93IGFuIGV4Y2VwdGlvbiBpZiB0aGUgcm9sZSBkb2VzIG5vdCBleGlzdFxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICogQHByaXZhdGVcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgX2FkZFVzZXJUb1JvbGVBc3luYzogYXN5bmMgZnVuY3Rpb24gKHVzZXJJZCwgcm9sZU5hbWUsIG9wdGlvbnMpIHtcbiAgICBSb2xlcy5fY2hlY2tSb2xlTmFtZShyb2xlTmFtZSlcbiAgICBSb2xlcy5fY2hlY2tTY29wZU5hbWUob3B0aW9ucy5zY29wZSlcblxuICAgIGlmICghdXNlcklkKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCByb2xlID0gYXdhaXQgTWV0ZW9yLnJvbGVzLmZpbmRPbmVBc3luYyhcbiAgICAgIHsgX2lkOiByb2xlTmFtZSB9LFxuICAgICAgeyBmaWVsZHM6IHsgY2hpbGRyZW46IDEgfSB9XG4gICAgKVxuXG4gICAgaWYgKCFyb2xlKSB7XG4gICAgICBpZiAob3B0aW9ucy5pZkV4aXN0cykge1xuICAgICAgICByZXR1cm4gW11cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlJvbGUgJ1wiICsgcm9sZU5hbWUgKyBcIicgZG9lcyBub3QgZXhpc3QuXCIpXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVGhpcyBtaWdodCBjcmVhdGUgZHVwbGljYXRlcywgYmVjYXVzZSB3ZSBkb24ndCBoYXZlIGEgdW5pcXVlIGluZGV4LCBidXQgdGhhdCdzIGFsbCByaWdodC4gSW4gY2FzZSB0aGVyZSBhcmUgdHdvLCB3aXRoZHJhd2luZyB0aGUgcm9sZSB3aWxsIGVmZmVjdGl2ZWx5IGtpbGwgdGhlbSBib3RoLlxuICAgIC8vIFRPRE8gcmV2aXNpdCB0aGlzXG4gICAgLyogY29uc3QgcmVzID0gYXdhaXQgTWV0ZW9yLnJvbGVBc3NpZ25tZW50LnVwc2VydEFzeW5jKFxuICAgICAge1xuICAgICAgICBcInVzZXIuX2lkXCI6IHVzZXJJZCxcbiAgICAgICAgXCJyb2xlLl9pZFwiOiByb2xlTmFtZSxcbiAgICAgICAgc2NvcGU6IG9wdGlvbnMuc2NvcGUsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICAkc2V0T25JbnNlcnQ6IHtcbiAgICAgICAgICB1c2VyOiB7IF9pZDogdXNlcklkIH0sXG4gICAgICAgICAgcm9sZTogeyBfaWQ6IHJvbGVOYW1lIH0sXG4gICAgICAgICAgc2NvcGU6IG9wdGlvbnMuc2NvcGUsXG4gICAgICAgIH0sXG4gICAgICB9XG4gICAgKTsgKi9cbiAgICBjb25zdCBleGlzdGluZ0Fzc2lnbm1lbnQgPSBhd2FpdCBNZXRlb3Iucm9sZUFzc2lnbm1lbnQuZmluZE9uZUFzeW5jKHtcbiAgICAgICd1c2VyLl9pZCc6IHVzZXJJZCxcbiAgICAgICdyb2xlLl9pZCc6IHJvbGVOYW1lLFxuICAgICAgc2NvcGU6IG9wdGlvbnMuc2NvcGVcbiAgICB9KVxuXG4gICAgbGV0IGluc2VydGVkSWRcbiAgICBsZXQgcmVzXG4gICAgaWYgKGV4aXN0aW5nQXNzaWdubWVudCkge1xuICAgICAgYXdhaXQgTWV0ZW9yLnJvbGVBc3NpZ25tZW50LnVwZGF0ZUFzeW5jKGV4aXN0aW5nQXNzaWdubWVudC5faWQsIHtcbiAgICAgICAgJHNldDoge1xuICAgICAgICAgIHVzZXI6IHsgX2lkOiB1c2VySWQgfSxcbiAgICAgICAgICByb2xlOiB7IF9pZDogcm9sZU5hbWUgfSxcbiAgICAgICAgICBzY29wZTogb3B0aW9ucy5zY29wZVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICByZXMgPSBhd2FpdCBNZXRlb3Iucm9sZUFzc2lnbm1lbnQuZmluZE9uZUFzeW5jKGV4aXN0aW5nQXNzaWdubWVudC5faWQpXG4gICAgfSBlbHNlIHtcbiAgICAgIGluc2VydGVkSWQgPSBhd2FpdCBNZXRlb3Iucm9sZUFzc2lnbm1lbnQuaW5zZXJ0QXN5bmMoe1xuICAgICAgICB1c2VyOiB7IF9pZDogdXNlcklkIH0sXG4gICAgICAgIHJvbGU6IHsgX2lkOiByb2xlTmFtZSB9LFxuICAgICAgICBzY29wZTogb3B0aW9ucy5zY29wZVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAoaW5zZXJ0ZWRJZCkge1xuICAgICAgYXdhaXQgTWV0ZW9yLnJvbGVBc3NpZ25tZW50LnVwZGF0ZUFzeW5jKFxuICAgICAgICB7IF9pZDogaW5zZXJ0ZWRJZCB9LFxuICAgICAgICB7XG4gICAgICAgICAgJHNldDoge1xuICAgICAgICAgICAgaW5oZXJpdGVkUm9sZXM6IFtcbiAgICAgICAgICAgICAgcm9sZU5hbWUsXG4gICAgICAgICAgICAgIC4uLihhd2FpdCBSb2xlcy5fZ2V0SW5oZXJpdGVkUm9sZU5hbWVzQXN5bmMocm9sZSkpXG4gICAgICAgICAgICBdLm1hcCgocikgPT4gKHsgX2lkOiByIH0pKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgKVxuXG4gICAgICByZXMgPSBhd2FpdCBNZXRlb3Iucm9sZUFzc2lnbm1lbnQuZmluZE9uZUFzeW5jKHsgX2lkOiBpbnNlcnRlZElkIH0pXG4gICAgfVxuICAgIHJlcy5pbnNlcnRlZElkID0gaW5zZXJ0ZWRJZCAvLyBGb3IgYmFja3dhcmQgY29tcGF0aWJpbGl0eVxuXG4gICAgcmV0dXJuIHJlc1xuICB9LFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIHJvbGUgbmFtZXMgdGhlIGdpdmVuIHJvbGUgbmFtZSBpcyBhIGNoaWxkIG9mLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiAgICAgUm9sZXMuX2dldFBhcmVudFJvbGVOYW1lcyh7IF9pZDogJ2FkbWluJywgY2hpbGRyZW47IFtdIH0pXG4gICAqXG4gICAqIEBtZXRob2QgX2dldFBhcmVudFJvbGVOYW1lc1xuICAgKiBAcGFyYW0ge29iamVjdH0gcm9sZSBUaGUgcm9sZSBvYmplY3RcbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqIEBwcml2YXRlXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIF9nZXRQYXJlbnRSb2xlTmFtZXNBc3luYzogYXN5bmMgZnVuY3Rpb24gKHJvbGUpIHtcbiAgICBpZiAoIXJvbGUpIHtcbiAgICAgIHJldHVybiBbXVxuICAgIH1cblxuICAgIGNvbnN0IHBhcmVudFJvbGVzID0gbmV3IFNldChbcm9sZS5faWRdKVxuXG4gICAgZm9yIChjb25zdCByb2xlTmFtZSBvZiBwYXJlbnRSb2xlcykge1xuICAgICAgZm9yIChjb25zdCBwYXJlbnRSb2xlIG9mIGF3YWl0IE1ldGVvci5yb2xlc1xuICAgICAgICAuZmluZCh7ICdjaGlsZHJlbi5faWQnOiByb2xlTmFtZSB9KVxuICAgICAgICAuZmV0Y2hBc3luYygpKSB7XG4gICAgICAgIHBhcmVudFJvbGVzLmFkZChwYXJlbnRSb2xlLl9pZClcbiAgICAgIH1cbiAgICB9XG5cbiAgICBwYXJlbnRSb2xlcy5kZWxldGUocm9sZS5faWQpXG5cbiAgICByZXR1cm4gWy4uLnBhcmVudFJvbGVzXVxuICB9LFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIHJvbGUgbmFtZXMgdGhlIGdpdmVuIHJvbGUgbmFtZSBpcyBhIHBhcmVudCBvZi5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogICAgIFJvbGVzLl9nZXRJbmhlcml0ZWRSb2xlTmFtZXMoeyBfaWQ6ICdhZG1pbicsIGNoaWxkcmVuOyBbXSB9KVxuICAgKlxuICAgKiBAbWV0aG9kIF9nZXRJbmhlcml0ZWRSb2xlTmFtZXNcbiAgICogQHBhcmFtIHtvYmplY3R9IHJvbGUgVGhlIHJvbGUgb2JqZWN0XG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKiBAcHJpdmF0ZVxuICAgKiBAc3RhdGljXG4gICAqL1xuICBfZ2V0SW5oZXJpdGVkUm9sZU5hbWVzQXN5bmM6IGFzeW5jIGZ1bmN0aW9uIChyb2xlKSB7XG4gICAgY29uc3QgaW5oZXJpdGVkUm9sZXMgPSBuZXcgU2V0KClcbiAgICBjb25zdCBuZXN0ZWRSb2xlcyA9IG5ldyBTZXQoW3JvbGVdKVxuXG4gICAgZm9yIChjb25zdCByIG9mIG5lc3RlZFJvbGVzKSB7XG4gICAgICBjb25zdCByb2xlcyA9IGF3YWl0IE1ldGVvci5yb2xlc1xuICAgICAgICAuZmluZChcbiAgICAgICAgICB7IF9pZDogeyAkaW46IHIuY2hpbGRyZW4ubWFwKChyKSA9PiByLl9pZCkgfSB9LFxuICAgICAgICAgIHsgZmllbGRzOiB7IGNoaWxkcmVuOiAxIH0gfVxuICAgICAgICApXG4gICAgICAgIC5mZXRjaEFzeW5jKClcblxuICAgICAgZm9yIChjb25zdCByMiBvZiByb2xlcykge1xuICAgICAgICBpbmhlcml0ZWRSb2xlcy5hZGQocjIuX2lkKVxuICAgICAgICBuZXN0ZWRSb2xlcy5hZGQocjIpXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIFsuLi5pbmhlcml0ZWRSb2xlc11cbiAgfSxcblxuICAvKipcbiAgICogUmVtb3ZlIHVzZXJzIGZyb20gYXNzaWduZWQgcm9sZXMuXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqICAgICBhd2FpdCBSb2xlcy5yZW1vdmVVc2Vyc0Zyb21Sb2xlc0FzeW5jKHVzZXJJZCwgJ2FkbWluJylcbiAgICogICAgIGF3YWl0IFJvbGVzLnJlbW92ZVVzZXJzRnJvbVJvbGVzQXN5bmMoW3VzZXJJZCwgdXNlcjJdLCBbJ2VkaXRvciddKVxuICAgKiAgICAgYXdhaXQgUm9sZXMucmVtb3ZlVXNlcnNGcm9tUm9sZXNBc3luYyh1c2VySWQsIFsndXNlciddLCAnZ3JvdXAxJylcbiAgICpcbiAgICogQG1ldGhvZCByZW1vdmVVc2Vyc0Zyb21Sb2xlc0FzeW5jXG4gICAqIEBwYXJhbSB7QXJyYXl8U3RyaW5nfSB1c2VycyBVc2VyIElEKHMpIG9yIG9iamVjdChzKSB3aXRoIGFuIGBfaWRgIGZpZWxkLlxuICAgKiBAcGFyYW0ge0FycmF5fFN0cmluZ30gcm9sZXMgTmFtZShzKSBvZiByb2xlcyB0byByZW1vdmUgdXNlcnMgZnJvbS4gUm9sZXMgaGF2ZSB0byBleGlzdC5cbiAgICogQHBhcmFtIHtPYmplY3R8U3RyaW5nfSBbb3B0aW9uc10gT3B0aW9uczpcbiAgICogICAtIGBzY29wZWA6IG5hbWUgb2YgdGhlIHNjb3BlLCBvciBgbnVsbGAgZm9yIHRoZSBnbG9iYWwgcm9sZVxuICAgKiAgIC0gYGFueVNjb3BlYDogaWYgc2V0LCByb2xlIGNhbiBiZSBpbiBhbnkgc2NvcGUgKGBzY29wZWAgb3B0aW9uIGlzIGlnbm9yZWQpXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKlxuICAgKiBBbHRlcm5hdGl2ZWx5LCBpdCBjYW4gYmUgYSBzY29wZSBuYW1lIHN0cmluZy5cbiAgICogQHN0YXRpY1xuICAgKi9cbiAgcmVtb3ZlVXNlcnNGcm9tUm9sZXNBc3luYzogYXN5bmMgZnVuY3Rpb24gKHVzZXJzLCByb2xlcywgb3B0aW9ucykge1xuICAgIGlmICghdXNlcnMpIHRocm93IG5ldyBFcnJvcihcIk1pc3NpbmcgJ3VzZXJzJyBwYXJhbS5cIilcbiAgICBpZiAoIXJvbGVzKSB0aHJvdyBuZXcgRXJyb3IoXCJNaXNzaW5nICdyb2xlcycgcGFyYW0uXCIpXG5cbiAgICBvcHRpb25zID0gUm9sZXMuX25vcm1hbGl6ZU9wdGlvbnMob3B0aW9ucylcblxuICAgIC8vIGVuc3VyZSBhcnJheXNcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkodXNlcnMpKSB1c2VycyA9IFt1c2Vyc11cbiAgICBpZiAoIUFycmF5LmlzQXJyYXkocm9sZXMpKSByb2xlcyA9IFtyb2xlc11cblxuICAgIFJvbGVzLl9jaGVja1Njb3BlTmFtZShvcHRpb25zLnNjb3BlKVxuXG4gICAgZm9yIChjb25zdCB1c2VyIG9mIHVzZXJzKSB7XG4gICAgICBpZiAoIXVzZXIpIHJldHVyblxuXG4gICAgICBmb3IgKGNvbnN0IHJvbGUgb2Ygcm9sZXMpIHtcbiAgICAgICAgbGV0IGlkXG4gICAgICAgIGlmICh0eXBlb2YgdXNlciA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICBpZCA9IHVzZXIuX2lkXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWQgPSB1c2VyXG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCBSb2xlcy5fcmVtb3ZlVXNlckZyb21Sb2xlQXN5bmMoaWQsIHJvbGUsIG9wdGlvbnMpXG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBSZW1vdmUgb25lIHVzZXIgZnJvbSBvbmUgcm9sZS5cbiAgICpcbiAgICogQG1ldGhvZCBfcmVtb3ZlVXNlckZyb21Sb2xlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSB1c2VySWQgVGhlIHVzZXIgSUQuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSByb2xlTmFtZSBOYW1lIG9mIHRoZSByb2xlIHRvIGFkZCB0aGUgdXNlciB0by4gVGhlIHJvbGUgaGF2ZSB0byBleGlzdC5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgT3B0aW9uczpcbiAgICogICAtIGBzY29wZWA6IG5hbWUgb2YgdGhlIHNjb3BlLCBvciBgbnVsbGAgZm9yIHRoZSBnbG9iYWwgcm9sZVxuICAgKiAgIC0gYGFueVNjb3BlYDogaWYgc2V0LCByb2xlIGNhbiBiZSBpbiBhbnkgc2NvcGUgKGBzY29wZWAgb3B0aW9uIGlzIGlnbm9yZWQpXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKiBAcHJpdmF0ZVxuICAgKiBAc3RhdGljXG4gICAqL1xuICBfcmVtb3ZlVXNlckZyb21Sb2xlQXN5bmM6IGFzeW5jIGZ1bmN0aW9uICh1c2VySWQsIHJvbGVOYW1lLCBvcHRpb25zKSB7XG4gICAgUm9sZXMuX2NoZWNrUm9sZU5hbWUocm9sZU5hbWUpXG4gICAgUm9sZXMuX2NoZWNrU2NvcGVOYW1lKG9wdGlvbnMuc2NvcGUpXG5cbiAgICBpZiAoIXVzZXJJZCkgcmV0dXJuXG5cbiAgICBjb25zdCBzZWxlY3RvciA9IHtcbiAgICAgICd1c2VyLl9pZCc6IHVzZXJJZCxcbiAgICAgICdyb2xlLl9pZCc6IHJvbGVOYW1lXG4gICAgfVxuXG4gICAgaWYgKCFvcHRpb25zLmFueVNjb3BlKSB7XG4gICAgICBzZWxlY3Rvci5zY29wZSA9IG9wdGlvbnMuc2NvcGVcbiAgICB9XG5cbiAgICBhd2FpdCBNZXRlb3Iucm9sZUFzc2lnbm1lbnQucmVtb3ZlQXN5bmMoc2VsZWN0b3IpXG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIHVzZXIgaGFzIHNwZWNpZmllZCByb2xlcy5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogICAgIC8vIGdsb2JhbCByb2xlc1xuICAgKiAgICAgYXdhaXQgUm9sZXMudXNlcklzSW5Sb2xlQXN5bmModXNlciwgJ2FkbWluJylcbiAgICogICAgIGF3YWl0IFJvbGVzLnVzZXJJc0luUm9sZUFzeW5jKHVzZXIsIFsnYWRtaW4nLCdlZGl0b3InXSlcbiAgICogICAgIGF3YWl0IFJvbGVzLnVzZXJJc0luUm9sZUFzeW5jKHVzZXJJZCwgJ2FkbWluJylcbiAgICogICAgIGF3YWl0IFJvbGVzLnVzZXJJc0luUm9sZUFzeW5jKHVzZXJJZCwgWydhZG1pbicsJ2VkaXRvciddKVxuICAgKlxuICAgKiAgICAgLy8gc2NvcGUgcm9sZXMgKGdsb2JhbCByb2xlcyBhcmUgc3RpbGwgY2hlY2tlZClcbiAgICogICAgIGF3YWl0IFJvbGVzLnVzZXJJc0luUm9sZUFzeW5jKHVzZXIsICdhZG1pbicsICdncm91cDEnKVxuICAgKiAgICAgYXdhaXQgUm9sZXMudXNlcklzSW5Sb2xlQXN5bmModXNlcklkLCBbJ2FkbWluJywnZWRpdG9yJ10sICdncm91cDEnKVxuICAgKiAgICAgYXdhaXQgUm9sZXMudXNlcklzSW5Sb2xlQXN5bmModXNlcklkLCBbJ2FkbWluJywnZWRpdG9yJ10sIHtzY29wZTogJ2dyb3VwMSd9KVxuICAgKlxuICAgKiBAbWV0aG9kIHVzZXJJc0luUm9sZUFzeW5jXG4gICAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdH0gdXNlciBVc2VyIElEIG9yIGFuIGFjdHVhbCB1c2VyIG9iamVjdC5cbiAgICogQHBhcmFtIHtBcnJheXxTdHJpbmd9IHJvbGVzIE5hbWUgb2Ygcm9sZSBvciBhbiBhcnJheSBvZiByb2xlcyB0byBjaGVjayBhZ2FpbnN0LiBJZiBhcnJheSxcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbGwgcmV0dXJuIGB0cnVlYCBpZiB1c2VyIGlzIGluIF9hbnlfIHJvbGUuXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSb2xlcyBkbyBub3QgaGF2ZSB0byBleGlzdC5cbiAgICogQHBhcmFtIHtPYmplY3R8U3RyaW5nfSBbb3B0aW9uc10gT3B0aW9uczpcbiAgICogICAtIGBzY29wZWA6IG5hbWUgb2YgdGhlIHNjb3BlOyBpZiBzdXBwbGllZCwgbGltaXRzIGNoZWNrIHRvIGp1c3QgdGhhdCBzY29wZVxuICAgKiAgICAgdGhlIHVzZXIncyBnbG9iYWwgcm9sZXMgd2lsbCBhbHdheXMgYmUgY2hlY2tlZCB3aGV0aGVyIHNjb3BlIGlzIHNwZWNpZmllZCBvciBub3RcbiAgICogICAtIGBhbnlTY29wZWA6IGlmIHNldCwgcm9sZSBjYW4gYmUgaW4gYW55IHNjb3BlIChgc2NvcGVgIG9wdGlvbiBpcyBpZ25vcmVkKVxuICAgKlxuICAgKiBBbHRlcm5hdGl2ZWx5LCBpdCBjYW4gYmUgYSBzY29wZSBuYW1lIHN0cmluZy5cbiAgICogQHJldHVybiB7UHJvbWlzZTxCb29sZWFuPn0gYHRydWVgIGlmIHVzZXIgaXMgaW4gX2FueV8gb2YgdGhlIHRhcmdldCByb2xlc1xuICAgKiBAc3RhdGljXG4gICAqL1xuICB1c2VySXNJblJvbGVBc3luYzogYXN5bmMgZnVuY3Rpb24gKHVzZXIsIHJvbGVzLCBvcHRpb25zKSB7XG4gICAgbGV0IGlkXG5cbiAgICBvcHRpb25zID0gUm9sZXMuX25vcm1hbGl6ZU9wdGlvbnMob3B0aW9ucylcblxuICAgIC8vIGVuc3VyZSBhcnJheSB0byBzaW1wbGlmeSBjb2RlXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHJvbGVzKSkgcm9sZXMgPSBbcm9sZXNdXG5cbiAgICByb2xlcyA9IHJvbGVzLmZpbHRlcigocikgPT4gciAhPSBudWxsKVxuXG4gICAgaWYgKCFyb2xlcy5sZW5ndGgpIHJldHVybiBmYWxzZVxuXG4gICAgUm9sZXMuX2NoZWNrU2NvcGVOYW1lKG9wdGlvbnMuc2NvcGUpXG5cbiAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHtcbiAgICAgICAgYW55U2NvcGU6IGZhbHNlXG4gICAgICB9LFxuICAgICAgb3B0aW9uc1xuICAgIClcblxuICAgIGlmICh1c2VyICYmIHR5cGVvZiB1c2VyID09PSAnb2JqZWN0Jykge1xuICAgICAgaWQgPSB1c2VyLl9pZFxuICAgIH0gZWxzZSB7XG4gICAgICBpZCA9IHVzZXJcbiAgICB9XG5cbiAgICBpZiAoIWlkKSByZXR1cm4gZmFsc2VcbiAgICBpZiAodHlwZW9mIGlkICE9PSAnc3RyaW5nJykgcmV0dXJuIGZhbHNlXG5cbiAgICBjb25zdCBzZWxlY3RvciA9IHtcbiAgICAgICd1c2VyLl9pZCc6IGlkXG4gICAgfVxuXG4gICAgaWYgKCFvcHRpb25zLmFueVNjb3BlKSB7XG4gICAgICBzZWxlY3Rvci5zY29wZSA9IHsgJGluOiBbb3B0aW9ucy5zY29wZSwgbnVsbF0gfVxuICAgIH1cblxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGFzeW5jU29tZShyb2xlcywgYXN5bmMgKHJvbGVOYW1lKSA9PiB7XG4gICAgICBzZWxlY3RvclsnaW5oZXJpdGVkUm9sZXMuX2lkJ10gPSByb2xlTmFtZVxuICAgICAgY29uc3Qgb3V0ID1cbiAgICAgICAgKGF3YWl0IE1ldGVvci5yb2xlQXNzaWdubWVudFxuICAgICAgICAgIC5maW5kKHNlbGVjdG9yLCB7IGxpbWl0OiAxIH0pXG4gICAgICAgICAgLmNvdW50QXN5bmMoKSkgPiAwXG4gICAgICByZXR1cm4gb3V0XG4gICAgfSlcblxuICAgIHJldHVybiByZXNcbiAgfSxcblxuICAvKipcbiAgICogUmV0cmlldmUgdXNlcidzIHJvbGVzLlxuICAgKlxuICAgKiBAbWV0aG9kIGdldFJvbGVzRm9yVXNlckFzeW5jXG4gICAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdH0gdXNlciBVc2VyIElEIG9yIGFuIGFjdHVhbCB1c2VyIG9iamVjdC5cbiAgICogQHBhcmFtIHtPYmplY3R8U3RyaW5nfSBbb3B0aW9uc10gT3B0aW9uczpcbiAgICogICAtIGBzY29wZWA6IG5hbWUgb2Ygc2NvcGUgdG8gcHJvdmlkZSByb2xlcyBmb3I7IGlmIG5vdCBzcGVjaWZpZWQsIGdsb2JhbCByb2xlcyBhcmUgcmV0dXJuZWRcbiAgICogICAtIGBhbnlTY29wZWA6IGlmIHNldCwgcm9sZSBjYW4gYmUgaW4gYW55IHNjb3BlIChgc2NvcGVgIGFuZCBgb25seUFzc2lnbmVkYCBvcHRpb25zIGFyZSBpZ25vcmVkKVxuICAgKiAgIC0gYG9ubHlTY29wZWRgOiBpZiBzZXQsIG9ubHkgcm9sZXMgaW4gdGhlIHNwZWNpZmllZCBzY29wZSBhcmUgcmV0dXJuZWRcbiAgICogICAtIGBvbmx5QXNzaWduZWRgOiByZXR1cm4gb25seSBhc3NpZ25lZCByb2xlcyBhbmQgbm90IGF1dG9tYXRpY2FsbHkgaW5mZXJyZWQgKGxpa2Ugc3Vicm9sZXMpXG4gICAqICAgLSBgZnVsbE9iamVjdHNgOiByZXR1cm4gZnVsbCByb2xlcyBvYmplY3RzIChgdHJ1ZWApIG9yIGp1c3QgbmFtZXMgKGBmYWxzZWApIChgb25seUFzc2lnbmVkYCBvcHRpb24gaXMgaWdub3JlZCkgKGRlZmF1bHQgYGZhbHNlYClcbiAgICogICAgIElmIHlvdSBoYXZlIGEgdXNlLWNhc2UgZm9yIHRoaXMgb3B0aW9uLCBwbGVhc2UgZmlsZSBhIGZlYXR1cmUtcmVxdWVzdC4gWW91IHNob3VsZG4ndCBuZWVkIHRvIHVzZSBpdCBhcyBpdCdzXG4gICAqICAgICByZXN1bHQgc3Ryb25nbHkgZGVwZW5kZW50IG9uIHRoZSBpbnRlcm5hbCBkYXRhIHN0cnVjdHVyZSBvZiB0aGlzIHBsdWdpbi5cbiAgICpcbiAgICogQWx0ZXJuYXRpdmVseSwgaXQgY2FuIGJlIGEgc2NvcGUgbmFtZSBzdHJpbmcuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8QXJyYXk+fSBBcnJheSBvZiB1c2VyJ3Mgcm9sZXMsIHVuc29ydGVkLlxuICAgKiBAc3RhdGljXG4gICAqL1xuICBnZXRSb2xlc0ZvclVzZXJBc3luYzogYXN5bmMgZnVuY3Rpb24gKHVzZXIsIG9wdGlvbnMpIHtcbiAgICBsZXQgaWRcblxuICAgIG9wdGlvbnMgPSBSb2xlcy5fbm9ybWFsaXplT3B0aW9ucyhvcHRpb25zKVxuXG4gICAgUm9sZXMuX2NoZWNrU2NvcGVOYW1lKG9wdGlvbnMuc2NvcGUpXG5cbiAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICBmdWxsT2JqZWN0czogZmFsc2UsXG4gICAgICBvbmx5QXNzaWduZWQ6IGZhbHNlLFxuICAgICAgYW55U2NvcGU6IGZhbHNlLFxuICAgICAgb25seVNjb3BlZDogZmFsc2VcbiAgICB9LCBvcHRpb25zKVxuXG4gICAgaWYgKHVzZXIgJiYgdHlwZW9mIHVzZXIgPT09ICdvYmplY3QnKSB7XG4gICAgICBpZCA9IHVzZXIuX2lkXG4gICAgfSBlbHNlIHtcbiAgICAgIGlkID0gdXNlclxuICAgIH1cblxuICAgIGlmICghaWQpIHJldHVybiBbXVxuXG4gICAgY29uc3Qgc2VsZWN0b3IgPSB7XG4gICAgICAndXNlci5faWQnOiBpZFxuICAgIH1cblxuICAgIGNvbnN0IGZpbHRlciA9IHtcbiAgICAgIGZpZWxkczogeyAnaW5oZXJpdGVkUm9sZXMuX2lkJzogMSB9XG4gICAgfVxuXG4gICAgaWYgKCFvcHRpb25zLmFueVNjb3BlKSB7XG4gICAgICBzZWxlY3Rvci5zY29wZSA9IHsgJGluOiBbb3B0aW9ucy5zY29wZV0gfVxuXG4gICAgICBpZiAoIW9wdGlvbnMub25seVNjb3BlZCkge1xuICAgICAgICBzZWxlY3Rvci5zY29wZS4kaW4ucHVzaChudWxsKVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChvcHRpb25zLm9ubHlBc3NpZ25lZCkge1xuICAgICAgZGVsZXRlIGZpbHRlci5maWVsZHNbJ2luaGVyaXRlZFJvbGVzLl9pZCddXG4gICAgICBmaWx0ZXIuZmllbGRzWydyb2xlLl9pZCddID0gMVxuICAgIH1cblxuICAgIGlmIChvcHRpb25zLmZ1bGxPYmplY3RzKSB7XG4gICAgICBkZWxldGUgZmlsdGVyLmZpZWxkc1xuICAgIH1cblxuICAgIGNvbnN0IHJvbGVzID0gYXdhaXQgTWV0ZW9yLnJvbGVBc3NpZ25tZW50LmZpbmQoc2VsZWN0b3IsIGZpbHRlcikuZmV0Y2hBc3luYygpXG5cbiAgICBpZiAob3B0aW9ucy5mdWxsT2JqZWN0cykge1xuICAgICAgcmV0dXJuIHJvbGVzXG4gICAgfVxuXG4gICAgcmV0dXJuIFtcbiAgICAgIC4uLm5ldyBTZXQoXG4gICAgICAgIHJvbGVzLnJlZHVjZSgocmV2LCBjdXJyZW50KSA9PiB7XG4gICAgICAgICAgaWYgKGN1cnJlbnQuaW5oZXJpdGVkUm9sZXMpIHtcbiAgICAgICAgICAgIHJldHVybiByZXYuY29uY2F0KGN1cnJlbnQuaW5oZXJpdGVkUm9sZXMubWFwKChyKSA9PiByLl9pZCkpXG4gICAgICAgICAgfSBlbHNlIGlmIChjdXJyZW50LnJvbGUpIHtcbiAgICAgICAgICAgIHJldi5wdXNoKGN1cnJlbnQucm9sZS5faWQpXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZXZcbiAgICAgICAgfSwgW10pXG4gICAgICApXG4gICAgXVxuICB9LFxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZSBjdXJzb3Igb2YgYWxsIGV4aXN0aW5nIHJvbGVzLlxuICAgKlxuICAgKiBAbWV0aG9kIGdldEFsbFJvbGVzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbcXVlcnlPcHRpb25zXSBPcHRpb25zIHdoaWNoIGFyZSBwYXNzZWQgZGlyZWN0bHlcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm91Z2ggdG8gYE1ldGVvci5yb2xlcy5maW5kKHF1ZXJ5LCBvcHRpb25zKWAuXG4gICAqIEByZXR1cm4ge0N1cnNvcn0gQ3Vyc29yIG9mIGV4aXN0aW5nIHJvbGVzLlxuICAgKiBAc3RhdGljXG4gICAqL1xuICBnZXRBbGxSb2xlczogZnVuY3Rpb24gKHF1ZXJ5T3B0aW9ucykge1xuICAgIHF1ZXJ5T3B0aW9ucyA9IHF1ZXJ5T3B0aW9ucyB8fCB7IHNvcnQ6IHsgX2lkOiAxIH0gfVxuXG4gICAgcmV0dXJuIE1ldGVvci5yb2xlcy5maW5kKHt9LCBxdWVyeU9wdGlvbnMpXG4gIH0sXG5cbiAgLyoqXG4gICAqIFJldHJpZXZlIGFsbCB1c2VycyB3aG8gYXJlIGluIHRhcmdldCByb2xlLlxuICAgKlxuICAgKiBPcHRpb25zOlxuICAgKlxuICAgKiBAbWV0aG9kIGdldFVzZXJzSW5Sb2xlQXN5bmNcbiAgICogQHBhcmFtIHtBcnJheXxTdHJpbmd9IHJvbGVzIE5hbWUgb2Ygcm9sZSBvciBhbiBhcnJheSBvZiByb2xlcy4gSWYgYXJyYXksIHVzZXJzXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5lZCB3aWxsIGhhdmUgYXQgbGVhc3Qgb25lIG9mIHRoZSByb2xlc1xuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3BlY2lmaWVkIGJ1dCBuZWVkIG5vdCBoYXZlIF9hbGxfIHJvbGVzLlxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUm9sZXMgZG8gbm90IGhhdmUgdG8gZXhpc3QuXG4gICAqIEBwYXJhbSB7T2JqZWN0fFN0cmluZ30gW29wdGlvbnNdIE9wdGlvbnM6XG4gICAqICAgLSBgc2NvcGVgOiBuYW1lIG9mIHRoZSBzY29wZSB0byByZXN0cmljdCByb2xlcyB0bzsgdXNlcidzIGdsb2JhbFxuICAgKiAgICAgcm9sZXMgd2lsbCBhbHNvIGJlIGNoZWNrZWRcbiAgICogICAtIGBhbnlTY29wZWA6IGlmIHNldCwgcm9sZSBjYW4gYmUgaW4gYW55IHNjb3BlIChgc2NvcGVgIG9wdGlvbiBpcyBpZ25vcmVkKVxuICAgKiAgIC0gYG9ubHlTY29wZWRgOiBpZiBzZXQsIG9ubHkgcm9sZXMgaW4gdGhlIHNwZWNpZmllZCBzY29wZSBhcmUgcmV0dXJuZWRcbiAgICogICAtIGBxdWVyeU9wdGlvbnNgOiBvcHRpb25zIHdoaWNoIGFyZSBwYXNzZWQgZGlyZWN0bHlcbiAgICogICAgIHRocm91Z2ggdG8gYE1ldGVvci51c2Vycy5maW5kKHF1ZXJ5LCBvcHRpb25zKWBcbiAgICpcbiAgICogQWx0ZXJuYXRpdmVseSwgaXQgY2FuIGJlIGEgc2NvcGUgbmFtZSBzdHJpbmcuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbcXVlcnlPcHRpb25zXSBPcHRpb25zIHdoaWNoIGFyZSBwYXNzZWQgZGlyZWN0bHlcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm91Z2ggdG8gYE1ldGVvci51c2Vycy5maW5kKHF1ZXJ5LCBvcHRpb25zKWBcbiAgICogQHJldHVybiB7UHJvbWlzZTxDdXJzb3I+fSBDdXJzb3Igb2YgdXNlcnMgaW4gcm9sZXMuXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIGdldFVzZXJzSW5Sb2xlQXN5bmM6IGFzeW5jIGZ1bmN0aW9uIChyb2xlcywgb3B0aW9ucywgcXVlcnlPcHRpb25zKSB7XG4gICAgY29uc3QgaWRzID0gKFxuICAgICAgYXdhaXQgUm9sZXMuZ2V0VXNlckFzc2lnbm1lbnRzRm9yUm9sZShyb2xlcywgb3B0aW9ucykuZmV0Y2hBc3luYygpXG4gICAgKS5tYXAoKGEpID0+IGEudXNlci5faWQpXG5cbiAgICByZXR1cm4gTWV0ZW9yLnVzZXJzLmZpbmQoXG4gICAgICB7IF9pZDogeyAkaW46IGlkcyB9IH0sXG4gICAgICAob3B0aW9ucyAmJiBvcHRpb25zLnF1ZXJ5T3B0aW9ucykgfHwgcXVlcnlPcHRpb25zIHx8IHt9XG4gICAgKVxuICB9LFxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZSBhbGwgYXNzaWdubWVudHMgb2YgYSB1c2VyIHdoaWNoIGFyZSBmb3IgdGhlIHRhcmdldCByb2xlLlxuICAgKlxuICAgKiBPcHRpb25zOlxuICAgKlxuICAgKiBAbWV0aG9kIGdldFVzZXJBc3NpZ25tZW50c0ZvclJvbGVcbiAgICogQHBhcmFtIHtBcnJheXxTdHJpbmd9IHJvbGVzIE5hbWUgb2Ygcm9sZSBvciBhbiBhcnJheSBvZiByb2xlcy4gSWYgYXJyYXksIHVzZXJzXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5lZCB3aWxsIGhhdmUgYXQgbGVhc3Qgb25lIG9mIHRoZSByb2xlc1xuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3BlY2lmaWVkIGJ1dCBuZWVkIG5vdCBoYXZlIF9hbGxfIHJvbGVzLlxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUm9sZXMgZG8gbm90IGhhdmUgdG8gZXhpc3QuXG4gICAqIEBwYXJhbSB7T2JqZWN0fFN0cmluZ30gW29wdGlvbnNdIE9wdGlvbnM6XG4gICAqICAgLSBgc2NvcGVgOiBuYW1lIG9mIHRoZSBzY29wZSB0byByZXN0cmljdCByb2xlcyB0bzsgdXNlcidzIGdsb2JhbFxuICAgKiAgICAgcm9sZXMgd2lsbCBhbHNvIGJlIGNoZWNrZWRcbiAgICogICAtIGBhbnlTY29wZWA6IGlmIHNldCwgcm9sZSBjYW4gYmUgaW4gYW55IHNjb3BlIChgc2NvcGVgIG9wdGlvbiBpcyBpZ25vcmVkKVxuICAgKiAgIC0gYHF1ZXJ5T3B0aW9uc2A6IG9wdGlvbnMgd2hpY2ggYXJlIHBhc3NlZCBkaXJlY3RseVxuICAgKiAgICAgdGhyb3VnaCB0byBgTWV0ZW9yLnJvbGVBc3NpZ25tZW50LmZpbmQocXVlcnksIG9wdGlvbnMpYFxuXG4gICAqIEFsdGVybmF0aXZlbHksIGl0IGNhbiBiZSBhIHNjb3BlIG5hbWUgc3RyaW5nLlxuICAgKiBAcmV0dXJuIHtDdXJzb3J9IEN1cnNvciBvZiB1c2VyIGFzc2lnbm1lbnRzIGZvciByb2xlcy5cbiAgICogQHN0YXRpY1xuICAgKi9cbiAgZ2V0VXNlckFzc2lnbm1lbnRzRm9yUm9sZTogZnVuY3Rpb24gKHJvbGVzLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IFJvbGVzLl9ub3JtYWxpemVPcHRpb25zKG9wdGlvbnMpXG5cbiAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHtcbiAgICAgICAgYW55U2NvcGU6IGZhbHNlLFxuICAgICAgICBxdWVyeU9wdGlvbnM6IHt9XG4gICAgICB9LFxuICAgICAgb3B0aW9uc1xuICAgIClcblxuICAgIHJldHVybiBSb2xlcy5fZ2V0VXNlcnNJblJvbGVDdXJzb3Iocm9sZXMsIG9wdGlvbnMsIG9wdGlvbnMucXVlcnlPcHRpb25zKVxuICB9LFxuXG4gIC8qKlxuICAgKiBAbWV0aG9kIF9nZXRVc2Vyc0luUm9sZUN1cnNvclxuICAgKiBAcGFyYW0ge0FycmF5fFN0cmluZ30gcm9sZXMgTmFtZSBvZiByb2xlIG9yIGFuIGFycmF5IG9mIHJvbGVzLiBJZiBhcnJheSwgaWRzIG9mIHVzZXJzIGFyZVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuZWQgd2hpY2ggaGF2ZSBhdCBsZWFzdCBvbmUgb2YgdGhlIHJvbGVzXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3NpZ25lZCBidXQgbmVlZCBub3QgaGF2ZSBfYWxsXyByb2xlcy5cbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJvbGVzIGRvIG5vdCBoYXZlIHRvIGV4aXN0LlxuICAgKiBAcGFyYW0ge09iamVjdHxTdHJpbmd9IFtvcHRpb25zXSBPcHRpb25zOlxuICAgKiAgIC0gYHNjb3BlYDogbmFtZSBvZiB0aGUgc2NvcGUgdG8gcmVzdHJpY3Qgcm9sZXMgdG87IHVzZXIncyBnbG9iYWxcbiAgICogICAgIHJvbGVzIHdpbGwgYWxzbyBiZSBjaGVja2VkXG4gICAqICAgLSBgYW55U2NvcGVgOiBpZiBzZXQsIHJvbGUgY2FuIGJlIGluIGFueSBzY29wZSAoYHNjb3BlYCBvcHRpb24gaXMgaWdub3JlZClcbiAgICpcbiAgICogQWx0ZXJuYXRpdmVseSwgaXQgY2FuIGJlIGEgc2NvcGUgbmFtZSBzdHJpbmcuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbZmlsdGVyXSBPcHRpb25zIHdoaWNoIGFyZSBwYXNzZWQgZGlyZWN0bHlcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm91Z2ggdG8gYE1ldGVvci5yb2xlQXNzaWdubWVudC5maW5kKHF1ZXJ5LCBvcHRpb25zKWBcbiAgICogQHJldHVybiB7T2JqZWN0fSBDdXJzb3IgdG8gdGhlIGFzc2lnbm1lbnQgZG9jdW1lbnRzXG4gICAqIEBwcml2YXRlXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIF9nZXRVc2Vyc0luUm9sZUN1cnNvcjogZnVuY3Rpb24gKHJvbGVzLCBvcHRpb25zLCBmaWx0ZXIpIHtcbiAgICBvcHRpb25zID0gUm9sZXMuX25vcm1hbGl6ZU9wdGlvbnMob3B0aW9ucylcblxuICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge1xuICAgICAgICBhbnlTY29wZTogZmFsc2UsXG4gICAgICAgIG9ubHlTY29wZWQ6IGZhbHNlXG4gICAgICB9LFxuICAgICAgb3B0aW9uc1xuICAgIClcblxuICAgIC8vIGVuc3VyZSBhcnJheSB0byBzaW1wbGlmeSBjb2RlXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHJvbGVzKSkgcm9sZXMgPSBbcm9sZXNdXG5cbiAgICBSb2xlcy5fY2hlY2tTY29wZU5hbWUob3B0aW9ucy5zY29wZSlcblxuICAgIGZpbHRlciA9IE9iamVjdC5hc3NpZ24oXG4gICAgICB7XG4gICAgICAgIGZpZWxkczogeyAndXNlci5faWQnOiAxIH1cbiAgICAgIH0sXG4gICAgICBmaWx0ZXJcbiAgICApXG5cbiAgICBjb25zdCBzZWxlY3RvciA9IHtcbiAgICAgICdpbmhlcml0ZWRSb2xlcy5faWQnOiB7ICRpbjogcm9sZXMgfVxuICAgIH1cblxuICAgIGlmICghb3B0aW9ucy5hbnlTY29wZSkge1xuICAgICAgc2VsZWN0b3Iuc2NvcGUgPSB7ICRpbjogW29wdGlvbnMuc2NvcGVdIH1cblxuICAgICAgaWYgKCFvcHRpb25zLm9ubHlTY29wZWQpIHtcbiAgICAgICAgc2VsZWN0b3Iuc2NvcGUuJGluLnB1c2gobnVsbClcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gTWV0ZW9yLnJvbGVBc3NpZ25tZW50LmZpbmQoc2VsZWN0b3IsIGZpbHRlcilcbiAgfSxcblxuICAvKipcbiAgICogRGVwcmVjYXRlZC4gVXNlIGBnZXRTY29wZXNGb3JVc2VyYCBpbnN0ZWFkLlxuICAgKlxuICAgKiBAbWV0aG9kIGdldEdyb3Vwc0ZvclVzZXJBc3luY1xuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxBcnJheT59XG4gICAqIEBzdGF0aWNcbiAgICogQGRlcHJlY2F0ZWRcbiAgICovXG4gIGdldEdyb3Vwc0ZvclVzZXJBc3luYzogYXN5bmMgZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICBpZiAoIWdldEdyb3Vwc0ZvclVzZXJEZXByZWNhdGlvbldhcm5pbmcpIHtcbiAgICAgIGdldEdyb3Vwc0ZvclVzZXJEZXByZWNhdGlvbldhcm5pbmcgPSB0cnVlXG4gICAgICBjb25zb2xlICYmXG4gICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICAnZ2V0R3JvdXBzRm9yVXNlciBoYXMgYmVlbiBkZXByZWNhdGVkLiBVc2UgZ2V0U2NvcGVzRm9yVXNlciBpbnN0ZWFkLidcbiAgICAgICAgKVxuICAgIH1cblxuICAgIHJldHVybiBhd2FpdCBSb2xlcy5nZXRTY29wZXNGb3JVc2VyKC4uLmFyZ3MpXG4gIH0sXG5cbiAgLyoqXG4gICAqIFJldHJpZXZlIHVzZXJzIHNjb3BlcywgaWYgYW55LlxuICAgKlxuICAgKiBAbWV0aG9kIGdldFNjb3Blc0ZvclVzZXJBc3luY1xuICAgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R9IHVzZXIgVXNlciBJRCBvciBhbiBhY3R1YWwgdXNlciBvYmplY3QuXG4gICAqIEBwYXJhbSB7QXJyYXl8U3RyaW5nfSBbcm9sZXNdIE5hbWUgb2Ygcm9sZXMgdG8gcmVzdHJpY3Qgc2NvcGVzIHRvLlxuICAgKlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEFycmF5Pn0gQXJyYXkgb2YgdXNlcidzIHNjb3BlcywgdW5zb3J0ZWQuXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIGdldFNjb3Blc0ZvclVzZXJBc3luYzogYXN5bmMgZnVuY3Rpb24gKHVzZXIsIHJvbGVzKSB7XG4gICAgbGV0IGlkXG5cbiAgICBpZiAocm9sZXMgJiYgIUFycmF5LmlzQXJyYXkocm9sZXMpKSByb2xlcyA9IFtyb2xlc11cblxuICAgIGlmICh1c2VyICYmIHR5cGVvZiB1c2VyID09PSAnb2JqZWN0Jykge1xuICAgICAgaWQgPSB1c2VyLl9pZFxuICAgIH0gZWxzZSB7XG4gICAgICBpZCA9IHVzZXJcbiAgICB9XG5cbiAgICBpZiAoIWlkKSByZXR1cm4gW11cblxuICAgIGNvbnN0IHNlbGVjdG9yID0ge1xuICAgICAgJ3VzZXIuX2lkJzogaWQsXG4gICAgICBzY29wZTogeyAkbmU6IG51bGwgfVxuICAgIH1cblxuICAgIGlmIChyb2xlcykge1xuICAgICAgc2VsZWN0b3JbJ2luaGVyaXRlZFJvbGVzLl9pZCddID0geyAkaW46IHJvbGVzIH1cbiAgICB9XG5cbiAgICBjb25zdCBzY29wZXMgPSAoXG4gICAgICBhd2FpdCBNZXRlb3Iucm9sZUFzc2lnbm1lbnRcbiAgICAgICAgLmZpbmQoc2VsZWN0b3IsIHsgZmllbGRzOiB7IHNjb3BlOiAxIH0gfSlcbiAgICAgICAgLmZldGNoQXN5bmMoKVxuICAgICkubWFwKChvYmkpID0+IG9iaS5zY29wZSlcblxuICAgIHJldHVybiBbLi4ubmV3IFNldChzY29wZXMpXVxuICB9LFxuXG4gIC8qKlxuICAgKiBSZW5hbWUgYSBzY29wZS5cbiAgICpcbiAgICogUm9sZXMgYXNzaWduZWQgd2l0aCBhIGdpdmVuIHNjb3BlIGFyZSBjaGFuZ2VkIHRvIGJlIHVuZGVyIHRoZSBuZXcgc2NvcGUuXG4gICAqXG4gICAqIEBtZXRob2QgcmVuYW1lU2NvcGVBc3luY1xuICAgKiBAcGFyYW0ge1N0cmluZ30gb2xkTmFtZSBPbGQgbmFtZSBvZiBhIHNjb3BlLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmV3TmFtZSBOZXcgbmFtZSBvZiBhIHNjb3BlLlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICogQHN0YXRpY1xuICAgKi9cbiAgcmVuYW1lU2NvcGVBc3luYzogYXN5bmMgZnVuY3Rpb24gKG9sZE5hbWUsIG5ld05hbWUpIHtcbiAgICBsZXQgY291bnRcblxuICAgIFJvbGVzLl9jaGVja1Njb3BlTmFtZShvbGROYW1lKVxuICAgIFJvbGVzLl9jaGVja1Njb3BlTmFtZShuZXdOYW1lKVxuXG4gICAgaWYgKG9sZE5hbWUgPT09IG5ld05hbWUpIHJldHVyblxuXG4gICAgZG8ge1xuICAgICAgY291bnQgPSBhd2FpdCBNZXRlb3Iucm9sZUFzc2lnbm1lbnQudXBkYXRlQXN5bmMoXG4gICAgICAgIHtcbiAgICAgICAgICBzY29wZTogb2xkTmFtZVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgJHNldDoge1xuICAgICAgICAgICAgc2NvcGU6IG5ld05hbWVcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHsgbXVsdGk6IHRydWUgfVxuICAgICAgKVxuICAgIH0gd2hpbGUgKGNvdW50ID4gMClcbiAgfSxcblxuICAvKipcbiAgICogUmVtb3ZlIGEgc2NvcGUuXG4gICAqXG4gICAqIFJvbGVzIGFzc2lnbmVkIHdpdGggYSBnaXZlbiBzY29wZSBhcmUgcmVtb3ZlZC5cbiAgICpcbiAgICogQG1ldGhvZCByZW1vdmVTY29wZUFzeW5jXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIGEgc2NvcGUuXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKiBAc3RhdGljXG4gICAqL1xuICByZW1vdmVTY29wZUFzeW5jOiBhc3luYyBmdW5jdGlvbiAobmFtZSkge1xuICAgIFJvbGVzLl9jaGVja1Njb3BlTmFtZShuYW1lKVxuXG4gICAgYXdhaXQgTWV0ZW9yLnJvbGVBc3NpZ25tZW50LnJlbW92ZUFzeW5jKHsgc2NvcGU6IG5hbWUgfSlcbiAgfSxcblxuICAvKipcbiAgICogVGhyb3cgYW4gZXhjZXB0aW9uIGlmIGByb2xlTmFtZWAgaXMgYW4gaW52YWxpZCByb2xlIG5hbWUuXG4gICAqXG4gICAqIEBtZXRob2QgX2NoZWNrUm9sZU5hbWVcbiAgICogQHBhcmFtIHtTdHJpbmd9IHJvbGVOYW1lIEEgcm9sZSBuYW1lIHRvIG1hdGNoIGFnYWluc3QuXG4gICAqIEBwcml2YXRlXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIF9jaGVja1JvbGVOYW1lOiBmdW5jdGlvbiAocm9sZU5hbWUpIHtcbiAgICBpZiAoXG4gICAgICAhcm9sZU5hbWUgfHxcbiAgICAgIHR5cGVvZiByb2xlTmFtZSAhPT0gJ3N0cmluZycgfHxcbiAgICAgIHJvbGVOYW1lLnRyaW0oKSAhPT0gcm9sZU5hbWVcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgcm9sZSBuYW1lICdcIiArIHJvbGVOYW1lICsgXCInLlwiKVxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogRmluZCBvdXQgaWYgYSByb2xlIGlzIGFuIGFuY2VzdG9yIG9mIGFub3RoZXIgcm9sZS5cbiAgICpcbiAgICogV0FSTklORzogSWYgeW91IGNoZWNrIHRoaXMgb24gdGhlIGNsaWVudCwgcGxlYXNlIG1ha2Ugc3VyZSBhbGwgcm9sZXMgYXJlIHB1Ymxpc2hlZC5cbiAgICpcbiAgICogQG1ldGhvZCBpc1BhcmVudE9mQXN5bmNcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhcmVudFJvbGVOYW1lIFRoZSByb2xlIHlvdSB3YW50IHRvIHJlc2VhcmNoLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gY2hpbGRSb2xlTmFtZSBUaGUgcm9sZSB5b3UgZXhwZWN0IHRvIGJlIGFtb25nIHRoZSBjaGlsZHJlbiBvZiBwYXJlbnRSb2xlTmFtZS5cbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqIEBzdGF0aWNcbiAgICovXG4gIGlzUGFyZW50T2ZBc3luYzogYXN5bmMgZnVuY3Rpb24gKHBhcmVudFJvbGVOYW1lLCBjaGlsZFJvbGVOYW1lKSB7XG4gICAgaWYgKHBhcmVudFJvbGVOYW1lID09PSBjaGlsZFJvbGVOYW1lKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cblxuICAgIGlmIChwYXJlbnRSb2xlTmFtZSA9PSBudWxsIHx8IGNoaWxkUm9sZU5hbWUgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgUm9sZXMuX2NoZWNrUm9sZU5hbWUocGFyZW50Um9sZU5hbWUpXG4gICAgUm9sZXMuX2NoZWNrUm9sZU5hbWUoY2hpbGRSb2xlTmFtZSlcblxuICAgIGxldCByb2xlc1RvQ2hlY2sgPSBbcGFyZW50Um9sZU5hbWVdXG4gICAgd2hpbGUgKHJvbGVzVG9DaGVjay5sZW5ndGggIT09IDApIHtcbiAgICAgIGNvbnN0IHJvbGVOYW1lID0gcm9sZXNUb0NoZWNrLnBvcCgpXG5cbiAgICAgIGlmIChyb2xlTmFtZSA9PT0gY2hpbGRSb2xlTmFtZSkge1xuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfVxuXG4gICAgICBjb25zdCByb2xlID0gYXdhaXQgTWV0ZW9yLnJvbGVzLmZpbmRPbmVBc3luYyh7IF9pZDogcm9sZU5hbWUgfSlcblxuICAgICAgLy8gVGhpcyBzaG91bGQgbm90IGhhcHBlbiwgYnV0IHRoaXMgaXMgYSBwcm9ibGVtIHRvIGFkZHJlc3MgYXQgc29tZSBvdGhlciB0aW1lLlxuICAgICAgaWYgKCFyb2xlKSBjb250aW51ZVxuXG4gICAgICByb2xlc1RvQ2hlY2sgPSByb2xlc1RvQ2hlY2suY29uY2F0KHJvbGUuY2hpbGRyZW4ubWFwKChyKSA9PiByLl9pZCkpXG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlXG4gIH0sXG5cbiAgLyoqXG4gICAqIE5vcm1hbGl6ZSBvcHRpb25zLlxuICAgKlxuICAgKiBAbWV0aG9kIF9ub3JtYWxpemVPcHRpb25zXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIE9wdGlvbnMgdG8gbm9ybWFsaXplLlxuICAgKiBAcmV0dXJuIHtPYmplY3R9IE5vcm1hbGl6ZWQgb3B0aW9ucy5cbiAgICogQHByaXZhdGVcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgX25vcm1hbGl6ZU9wdGlvbnM6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgPT09IHVuZGVmaW5lZCA/IHt9IDogb3B0aW9uc1xuXG4gICAgaWYgKG9wdGlvbnMgPT09IG51bGwgfHwgdHlwZW9mIG9wdGlvbnMgPT09ICdzdHJpbmcnKSB7XG4gICAgICBvcHRpb25zID0geyBzY29wZTogb3B0aW9ucyB9XG4gICAgfVxuXG4gICAgb3B0aW9ucy5zY29wZSA9IFJvbGVzLl9ub3JtYWxpemVTY29wZU5hbWUob3B0aW9ucy5zY29wZSlcblxuICAgIHJldHVybiBvcHRpb25zXG4gIH0sXG5cbiAgLyoqXG4gICAqIE5vcm1hbGl6ZSBzY29wZSBuYW1lLlxuICAgKlxuICAgKiBAbWV0aG9kIF9ub3JtYWxpemVTY29wZU5hbWVcbiAgICogQHBhcmFtIHtTdHJpbmd9IHNjb3BlTmFtZSBBIHNjb3BlIG5hbWUgdG8gbm9ybWFsaXplLlxuICAgKiBAcmV0dXJuIHtTdHJpbmd9IE5vcm1hbGl6ZWQgc2NvcGUgbmFtZS5cbiAgICogQHByaXZhdGVcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgX25vcm1hbGl6ZVNjb3BlTmFtZTogZnVuY3Rpb24gKHNjb3BlTmFtZSkge1xuICAgIC8vIG1hcCB1bmRlZmluZWQgYW5kIG51bGwgdG8gbnVsbFxuICAgIGlmIChzY29wZU5hbWUgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG51bGxcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHNjb3BlTmFtZVxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogVGhyb3cgYW4gZXhjZXB0aW9uIGlmIGBzY29wZU5hbWVgIGlzIGFuIGludmFsaWQgc2NvcGUgbmFtZS5cbiAgICpcbiAgICogQG1ldGhvZCBfY2hlY2tSb2xlTmFtZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gc2NvcGVOYW1lIEEgc2NvcGUgbmFtZSB0byBtYXRjaCBhZ2FpbnN0LlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAc3RhdGljXG4gICAqL1xuICBfY2hlY2tTY29wZU5hbWU6IGZ1bmN0aW9uIChzY29wZU5hbWUpIHtcbiAgICBpZiAoc2NvcGVOYW1lID09PSBudWxsKSByZXR1cm5cblxuICAgIGlmIChcbiAgICAgICFzY29wZU5hbWUgfHxcbiAgICAgIHR5cGVvZiBzY29wZU5hbWUgIT09ICdzdHJpbmcnIHx8XG4gICAgICBzY29wZU5hbWUudHJpbSgpICE9PSBzY29wZU5hbWVcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgc2NvcGUgbmFtZSAnXCIgKyBzY29wZU5hbWUgKyBcIicuXCIpXG4gICAgfVxuICB9XG59KVxuIiwiLyogZ2xvYmFsIE1ldGVvciwgUm9sZXMgKi9cbmxldCBpbmRleEZuQXNzaWdubWVudFxubGV0IGluZGV4Rm5Sb2xlc1xuXG5pZiAoTWV0ZW9yLnJvbGVzLmNyZWF0ZUluZGV4QXN5bmMpIHtcbiAgaW5kZXhGbkFzc2lnbm1lbnQgPSBNZXRlb3Iucm9sZUFzc2lnbm1lbnQuY3JlYXRlSW5kZXhBc3luYy5iaW5kKE1ldGVvci5yb2xlQXNzaWdubWVudClcbiAgaW5kZXhGblJvbGVzID0gTWV0ZW9yLnJvbGVzLmNyZWF0ZUluZGV4QXN5bmMuYmluZChNZXRlb3Iucm9sZXMpXG59IGVsc2UgaWYgKE1ldGVvci5yb2xlcy5jcmVhdGVJbmRleCkge1xuICBpbmRleEZuQXNzaWdubWVudCA9IE1ldGVvci5yb2xlQXNzaWdubWVudC5jcmVhdGVJbmRleC5iaW5kKE1ldGVvci5yb2xlQXNzaWdubWVudClcbiAgaW5kZXhGblJvbGVzID0gTWV0ZW9yLnJvbGVzLmNyZWF0ZUluZGV4LmJpbmQoTWV0ZW9yLnJvbGVzKVxufSBlbHNlIHtcbiAgaW5kZXhGbkFzc2lnbm1lbnQgPSBNZXRlb3Iucm9sZUFzc2lnbm1lbnQuX2Vuc3VyZUluZGV4LmJpbmQoTWV0ZW9yLnJvbGVBc3NpZ25tZW50KVxuICBpbmRleEZuUm9sZXMgPSBNZXRlb3Iucm9sZXMuX2Vuc3VyZUluZGV4LmJpbmQoTWV0ZW9yLnJvbGVzKVxufVxuXG5bXG4gIHsgJ3VzZXIuX2lkJzogMSwgJ2luaGVyaXRlZFJvbGVzLl9pZCc6IDEsIHNjb3BlOiAxIH0sXG4gIHsgJ3VzZXIuX2lkJzogMSwgJ3JvbGUuX2lkJzogMSwgc2NvcGU6IDEgfSxcbiAgeyAncm9sZS5faWQnOiAxIH0sXG4gIHsgc2NvcGU6IDEsICd1c2VyLl9pZCc6IDEsICdpbmhlcml0ZWRSb2xlcy5faWQnOiAxIH0sIC8vIEFkZGluZyB1c2VySWQgYW5kIHJvbGVJZCBtaWdodCBzcGVlZCB1cCBvdGhlciBxdWVyaWVzIGRlcGVuZGluZyBvbiB0aGUgZmlyc3QgaW5kZXhcbiAgeyAnaW5oZXJpdGVkUm9sZXMuX2lkJzogMSB9XG5dLmZvckVhY2goaW5kZXggPT4gaW5kZXhGbkFzc2lnbm1lbnQoaW5kZXgpKVxuaW5kZXhGblJvbGVzKHsgJ2NoaWxkcmVuLl9pZCc6IDEgfSlcblxuLypcbiAqIFB1Ymxpc2ggbG9nZ2VkLWluIHVzZXIncyByb2xlcyBzbyBjbGllbnQtc2lkZSBjaGVja3MgY2FuIHdvcmsuXG4gKlxuICogVXNlIGEgbmFtZWQgcHVibGlzaCBmdW5jdGlvbiBzbyBjbGllbnRzIGNhbiBjaGVjayBgcmVhZHkoKWAgc3RhdGUuXG4gKi9cbk1ldGVvci5wdWJsaXNoKCdfcm9sZXMnLCBmdW5jdGlvbiAoKSB7XG4gIGNvbnN0IGxvZ2dlZEluVXNlcklkID0gdGhpcy51c2VySWRcbiAgY29uc3QgZmllbGRzID0geyByb2xlczogMSB9XG5cbiAgaWYgKCFsb2dnZWRJblVzZXJJZCkge1xuICAgIHRoaXMucmVhZHkoKVxuICAgIHJldHVyblxuICB9XG5cbiAgcmV0dXJuIE1ldGVvci51c2Vycy5maW5kKFxuICAgIHsgX2lkOiBsb2dnZWRJblVzZXJJZCB9LFxuICAgIHsgZmllbGRzIH1cbiAgKVxufSlcblxuT2JqZWN0LmFzc2lnbihSb2xlcywge1xuICAvKipcbiAgICogQG1ldGhvZCBfaXNOZXdSb2xlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSByb2xlIGBNZXRlb3Iucm9sZXNgIGRvY3VtZW50LlxuICAgKiBAcmV0dXJuIHtCb29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgYHJvbGVgIGlzIGluIHRoZSBuZXcgZm9ybWF0LlxuICAgKiAgICAgICAgICAgICAgICAgICBJZiBpdCBpcyBhbWJpZ3VvdXMgb3IgaXQgaXMgbm90LCByZXR1cm5zIGBmYWxzZWAuXG4gICAqIEBmb3IgUm9sZXNcbiAgICogQHByaXZhdGVcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgX2lzTmV3Um9sZTogZnVuY3Rpb24gKHJvbGUpIHtcbiAgICByZXR1cm4gISgnbmFtZScgaW4gcm9sZSkgJiYgJ2NoaWxkcmVuJyBpbiByb2xlXG4gIH0sXG5cbiAgLyoqXG4gICAqIEBtZXRob2QgX2lzT2xkUm9sZVxuICAgKiBAcGFyYW0ge09iamVjdH0gcm9sZSBgTWV0ZW9yLnJvbGVzYCBkb2N1bWVudC5cbiAgICogQHJldHVybiB7Qm9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGByb2xlYCBpcyBpbiB0aGUgb2xkIGZvcm1hdC5cbiAgICogICAgICAgICAgICAgICAgICAgSWYgaXQgaXMgYW1iaWd1b3VzIG9yIGl0IGlzIG5vdCwgcmV0dXJucyBgZmFsc2VgLlxuICAgKiBAZm9yIFJvbGVzXG4gICAqIEBwcml2YXRlXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIF9pc09sZFJvbGU6IGZ1bmN0aW9uIChyb2xlKSB7XG4gICAgcmV0dXJuICduYW1lJyBpbiByb2xlICYmICEoJ2NoaWxkcmVuJyBpbiByb2xlKVxuICB9LFxuXG4gIC8qKlxuICAgKiBAbWV0aG9kIF9pc05ld0ZpZWxkXG4gICAqIEBwYXJhbSB7QXJyYXl9IHJvbGVzIGBNZXRlb3IudXNlcnNgIGRvY3VtZW50IGByb2xlc2AgZmllbGQuXG4gICAqIEByZXR1cm4ge0Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBgcm9sZXNgIGZpZWxkIGlzIGluIHRoZSBuZXcgZm9ybWF0LlxuICAgKiAgICAgICAgICAgICAgICAgICBJZiBpdCBpcyBhbWJpZ3VvdXMgb3IgaXQgaXMgbm90LCByZXR1cm5zIGBmYWxzZWAuXG4gICAqIEBmb3IgUm9sZXNcbiAgICogQHByaXZhdGVcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgX2lzTmV3RmllbGQ6IGZ1bmN0aW9uIChyb2xlcykge1xuICAgIHJldHVybiBBcnJheS5pc0FycmF5KHJvbGVzKSAmJiB0eXBlb2Ygcm9sZXNbMF0gPT09ICdvYmplY3QnXG4gIH0sXG5cbiAgLyoqXG4gICAqIEBtZXRob2QgX2lzT2xkRmllbGRcbiAgICogQHBhcmFtIHtBcnJheX0gcm9sZXMgYE1ldGVvci51c2Vyc2AgZG9jdW1lbnQgYHJvbGVzYCBmaWVsZC5cbiAgICogQHJldHVybiB7Qm9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGByb2xlc2AgZmllbGQgaXMgaW4gdGhlIG9sZCBmb3JtYXQuXG4gICAqICAgICAgICAgICAgICAgICAgIElmIGl0IGlzIGFtYmlndW91cyBvciBpdCBpcyBub3QsIHJldHVybnMgYGZhbHNlYC5cbiAgICogQGZvciBSb2xlc1xuICAgKiBAcHJpdmF0ZVxuICAgKiBAc3RhdGljXG4gICAqL1xuICBfaXNPbGRGaWVsZDogZnVuY3Rpb24gKHJvbGVzKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIChBcnJheS5pc0FycmF5KHJvbGVzKSAmJiB0eXBlb2Ygcm9sZXNbMF0gPT09ICdzdHJpbmcnKSB8fFxuICAgICAgKHR5cGVvZiByb2xlcyA9PT0gJ29iamVjdCcgJiYgIUFycmF5LmlzQXJyYXkocm9sZXMpKVxuICAgIClcbiAgfSxcblxuICAvKipcbiAgICogQG1ldGhvZCBfY29udmVydFRvTmV3Um9sZVxuICAgKiBAcGFyYW0ge09iamVjdH0gb2xkUm9sZSBgTWV0ZW9yLnJvbGVzYCBkb2N1bWVudC5cbiAgICogQHJldHVybiB7T2JqZWN0fSBDb252ZXJ0ZWQgYHJvbGVgIHRvIHRoZSBuZXcgZm9ybWF0LlxuICAgKiBAZm9yIFJvbGVzXG4gICAqIEBwcml2YXRlXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIF9jb252ZXJ0VG9OZXdSb2xlOiBmdW5jdGlvbiAob2xkUm9sZSkge1xuICAgIGlmICghKHR5cGVvZiBvbGRSb2xlLm5hbWUgPT09ICdzdHJpbmcnKSkgeyB0aHJvdyBuZXcgRXJyb3IoXCJSb2xlIG5hbWUgJ1wiICsgb2xkUm9sZS5uYW1lICsgXCInIGlzIG5vdCBhIHN0cmluZy5cIikgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIF9pZDogb2xkUm9sZS5uYW1lLFxuICAgICAgY2hpbGRyZW46IFtdXG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBAbWV0aG9kIF9jb252ZXJ0VG9PbGRSb2xlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBuZXdSb2xlIGBNZXRlb3Iucm9sZXNgIGRvY3VtZW50LlxuICAgKiBAcmV0dXJuIHtPYmplY3R9IENvbnZlcnRlZCBgcm9sZWAgdG8gdGhlIG9sZCBmb3JtYXQuXG4gICAqIEBmb3IgUm9sZXNcbiAgICogQHByaXZhdGVcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgX2NvbnZlcnRUb09sZFJvbGU6IGZ1bmN0aW9uIChuZXdSb2xlKSB7XG4gICAgaWYgKCEodHlwZW9mIG5ld1JvbGUuX2lkID09PSAnc3RyaW5nJykpIHsgdGhyb3cgbmV3IEVycm9yKFwiUm9sZSBuYW1lICdcIiArIG5ld1JvbGUuX2lkICsgXCInIGlzIG5vdCBhIHN0cmluZy5cIikgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWU6IG5ld1JvbGUuX2lkXG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBAbWV0aG9kIF9jb252ZXJ0VG9OZXdGaWVsZFxuICAgKiBAcGFyYW0ge0FycmF5fSBvbGRSb2xlcyBgTWV0ZW9yLnVzZXJzYCBkb2N1bWVudCBgcm9sZXNgIGZpZWxkIGluIHRoZSBvbGQgZm9ybWF0LlxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IGNvbnZlcnRVbmRlcnNjb3Jlc1RvRG90cyBTaG91bGQgd2UgY29udmVydCB1bmRlcnNjb3JlcyB0byBkb3RzIGluIGdyb3VwIG5hbWVzLlxuICAgKiBAcmV0dXJuIHtBcnJheX0gQ29udmVydGVkIGByb2xlc2AgdG8gdGhlIG5ldyBmb3JtYXQuXG4gICAqIEBmb3IgUm9sZXNcbiAgICogQHByaXZhdGVcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgX2NvbnZlcnRUb05ld0ZpZWxkOiBmdW5jdGlvbiAob2xkUm9sZXMsIGNvbnZlcnRVbmRlcnNjb3Jlc1RvRG90cykge1xuICAgIGNvbnN0IHJvbGVzID0gW11cbiAgICBpZiAoQXJyYXkuaXNBcnJheShvbGRSb2xlcykpIHtcbiAgICAgIG9sZFJvbGVzLmZvckVhY2goZnVuY3Rpb24gKHJvbGUsIGluZGV4KSB7XG4gICAgICAgIGlmICghKHR5cGVvZiByb2xlID09PSAnc3RyaW5nJykpIHsgdGhyb3cgbmV3IEVycm9yKFwiUm9sZSAnXCIgKyByb2xlICsgXCInIGlzIG5vdCBhIHN0cmluZy5cIikgfVxuXG4gICAgICAgIHJvbGVzLnB1c2goe1xuICAgICAgICAgIF9pZDogcm9sZSxcbiAgICAgICAgICBzY29wZTogbnVsbCxcbiAgICAgICAgICBhc3NpZ25lZDogdHJ1ZVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBvbGRSb2xlcyA9PT0gJ29iamVjdCcpIHtcbiAgICAgIE9iamVjdC5lbnRyaWVzKG9sZFJvbGVzKS5mb3JFYWNoKChbZ3JvdXAsIHJvbGVzQXJyYXldKSA9PiB7XG4gICAgICAgIGlmIChncm91cCA9PT0gJ19fZ2xvYmFsX3JvbGVzX18nKSB7XG4gICAgICAgICAgZ3JvdXAgPSBudWxsXG4gICAgICAgIH0gZWxzZSBpZiAoY29udmVydFVuZGVyc2NvcmVzVG9Eb3RzKSB7XG4gICAgICAgICAgLy8gdW5lc2NhcGVcbiAgICAgICAgICBncm91cCA9IGdyb3VwLnJlcGxhY2UoL18vZywgJy4nKVxuICAgICAgICB9XG5cbiAgICAgICAgcm9sZXNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uIChyb2xlKSB7XG4gICAgICAgICAgaWYgKCEodHlwZW9mIHJvbGUgPT09ICdzdHJpbmcnKSkgeyB0aHJvdyBuZXcgRXJyb3IoXCJSb2xlICdcIiArIHJvbGUgKyBcIicgaXMgbm90IGEgc3RyaW5nLlwiKSB9XG5cbiAgICAgICAgICByb2xlcy5wdXNoKHtcbiAgICAgICAgICAgIF9pZDogcm9sZSxcbiAgICAgICAgICAgIHNjb3BlOiBncm91cCxcbiAgICAgICAgICAgIGFzc2lnbmVkOiB0cnVlXG4gICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgfVxuICAgIHJldHVybiByb2xlc1xuICB9LFxuXG4gIC8qKlxuICAgKiBAbWV0aG9kIF9jb252ZXJ0VG9PbGRGaWVsZFxuICAgKiBAcGFyYW0ge0FycmF5fSBuZXdSb2xlcyBgTWV0ZW9yLnVzZXJzYCBkb2N1bWVudCBgcm9sZXNgIGZpZWxkIGluIHRoZSBuZXcgZm9ybWF0LlxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IHVzaW5nR3JvdXBzIFNob3VsZCB3ZSB1c2UgZ3JvdXBzIG9yIG5vdC5cbiAgICogQHJldHVybiB7QXJyYXl9IENvbnZlcnRlZCBgcm9sZXNgIHRvIHRoZSBvbGQgZm9ybWF0LlxuICAgKiBAZm9yIFJvbGVzXG4gICAqIEBwcml2YXRlXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIF9jb252ZXJ0VG9PbGRGaWVsZDogZnVuY3Rpb24gKG5ld1JvbGVzLCB1c2luZ0dyb3Vwcykge1xuICAgIGxldCByb2xlc1xuXG4gICAgaWYgKHVzaW5nR3JvdXBzKSB7XG4gICAgICByb2xlcyA9IHt9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJvbGVzID0gW11cbiAgICB9XG5cbiAgICBuZXdSb2xlcy5mb3JFYWNoKGZ1bmN0aW9uICh1c2VyUm9sZSkge1xuICAgICAgaWYgKCEodHlwZW9mIHVzZXJSb2xlID09PSAnb2JqZWN0JykpIHsgdGhyb3cgbmV3IEVycm9yKFwiUm9sZSAnXCIgKyB1c2VyUm9sZSArIFwiJyBpcyBub3QgYW4gb2JqZWN0LlwiKSB9XG5cbiAgICAgIC8vIFdlIGFzc3VtZSB0aGF0IHdlIGFyZSBjb252ZXJ0aW5nIGJhY2sgYSBmYWlsZWQgbWlncmF0aW9uLCBzbyB2YWx1ZXMgY2FuIG9ubHkgYmVcbiAgICAgIC8vIHdoYXQgd2VyZSB2YWxpZCB2YWx1ZXMgaW4gMS4wLiBTbyBubyBncm91cCBuYW1lcyBzdGFydGluZyB3aXRoICQgYW5kIG5vIHN1YnJvbGVzLlxuXG4gICAgICBpZiAodXNlclJvbGUuc2NvcGUpIHtcbiAgICAgICAgaWYgKCF1c2luZ0dyb3Vwcykge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgIFwiUm9sZSAnXCIgK1xuICAgICAgICAgICAgICB1c2VyUm9sZS5faWQgK1xuICAgICAgICAgICAgICBcIicgd2l0aCBzY29wZSAnXCIgK1xuICAgICAgICAgICAgICB1c2VyUm9sZS5zY29wZSArXG4gICAgICAgICAgICAgIFwiJyB3aXRob3V0IGVuYWJsZWQgZ3JvdXBzLlwiXG4gICAgICAgICAgKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gZXNjYXBlXG4gICAgICAgIGNvbnN0IHNjb3BlID0gdXNlclJvbGUuc2NvcGUucmVwbGFjZSgvXFwuL2csICdfJylcblxuICAgICAgICBpZiAoc2NvcGVbMF0gPT09ICckJykgeyB0aHJvdyBuZXcgRXJyb3IoXCJHcm91cCBuYW1lICdcIiArIHNjb3BlICsgXCInIHN0YXJ0IHdpdGggJC5cIikgfVxuXG4gICAgICAgIHJvbGVzW3Njb3BlXSA9IHJvbGVzW3Njb3BlXSB8fCBbXVxuICAgICAgICByb2xlc1tzY29wZV0ucHVzaCh1c2VyUm9sZS5faWQpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodXNpbmdHcm91cHMpIHtcbiAgICAgICAgICByb2xlcy5fX2dsb2JhbF9yb2xlc19fID0gcm9sZXMuX19nbG9iYWxfcm9sZXNfXyB8fCBbXVxuICAgICAgICAgIHJvbGVzLl9fZ2xvYmFsX3JvbGVzX18ucHVzaCh1c2VyUm9sZS5faWQpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcm9sZXMucHVzaCh1c2VyUm9sZS5faWQpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuICAgIHJldHVybiByb2xlc1xuICB9LFxuXG4gIC8qKlxuICAgKiBAbWV0aG9kIF9kZWZhdWx0VXBkYXRlVXNlclxuICAgKiBAcGFyYW0ge09iamVjdH0gdXNlciBgTWV0ZW9yLnVzZXJzYCBkb2N1bWVudC5cbiAgICogQHBhcmFtIHtBcnJheXxPYmplY3R9IHJvbGVzIFZhbHVlIHRvIHdoaWNoIHVzZXIncyBgcm9sZXNgIGZpZWxkIHNob3VsZCBiZSBzZXQuXG4gICAqIEBmb3IgUm9sZXNcbiAgICogQHByaXZhdGVcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgX2RlZmF1bHRVcGRhdGVVc2VyOiBmdW5jdGlvbiAodXNlciwgcm9sZXMpIHtcbiAgICBNZXRlb3IudXNlcnMudXBkYXRlKFxuICAgICAge1xuICAgICAgICBfaWQ6IHVzZXIuX2lkLFxuICAgICAgICAvLyBtYWtpbmcgc3VyZSBub3RoaW5nIGNoYW5nZWQgaW4gbWVhbnRpbWVcbiAgICAgICAgcm9sZXM6IHVzZXIucm9sZXNcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgICRzZXQ6IHsgcm9sZXMgfVxuICAgICAgfVxuICAgIClcbiAgfSxcblxuICAvKipcbiAgICogQG1ldGhvZCBfZGVmYXVsdFVwZGF0ZVJvbGVcbiAgICogQHBhcmFtIHtPYmplY3R9IG9sZFJvbGUgT2xkIGBNZXRlb3Iucm9sZXNgIGRvY3VtZW50LlxuICAgKiBAcGFyYW0ge09iamVjdH0gbmV3Um9sZSBOZXcgYE1ldGVvci5yb2xlc2AgZG9jdW1lbnQuXG4gICAqIEBmb3IgUm9sZXNcbiAgICogQHByaXZhdGVcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgX2RlZmF1bHRVcGRhdGVSb2xlOiBmdW5jdGlvbiAob2xkUm9sZSwgbmV3Um9sZSkge1xuICAgIE1ldGVvci5yb2xlcy5yZW1vdmUob2xkUm9sZS5faWQpXG4gICAgTWV0ZW9yLnJvbGVzLmluc2VydChuZXdSb2xlKVxuICB9LFxuXG4gIC8qKlxuICAgKiBAbWV0aG9kIF9kcm9wQ29sbGVjdGlvbkluZGV4XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjb2xsZWN0aW9uIENvbGxlY3Rpb24gb24gd2hpY2ggdG8gZHJvcCB0aGUgaW5kZXguXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBpbmRleE5hbWUgTmFtZSBvZiB0aGUgaW5kZXggdG8gZHJvcC5cbiAgICogQGZvciBSb2xlc1xuICAgKiBAcHJpdmF0ZVxuICAgKiBAc3RhdGljXG4gICAqL1xuICBfZHJvcENvbGxlY3Rpb25JbmRleDogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGluZGV4TmFtZSkge1xuICAgIHRyeSB7XG4gICAgICBjb2xsZWN0aW9uLl9kcm9wSW5kZXgoaW5kZXhOYW1lKVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnN0IGluZGV4Tm90Rm91bmQgPSAvaW5kZXggbm90IGZvdW5kLy50ZXN0KGUubWVzc2FnZSB8fCBlLmVyciB8fCBlLmVycm1zZylcblxuICAgICAgaWYgKCFpbmRleE5vdEZvdW5kKSB7XG4gICAgICAgIHRocm93IGVcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIE1pZ3JhdGVzIGBNZXRlb3IudXNlcnNgIGFuZCBgTWV0ZW9yLnJvbGVzYCB0byB0aGUgbmV3IGZvcm1hdC5cbiAgICpcbiAgICogQG1ldGhvZCBfZm9yd2FyZE1pZ3JhdGVcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gdXBkYXRlVXNlciBGdW5jdGlvbiB3aGljaCB1cGRhdGVzIHRoZSB1c2VyIG9iamVjdC4gRGVmYXVsdCBgX2RlZmF1bHRVcGRhdGVVc2VyYC5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gdXBkYXRlUm9sZSBGdW5jdGlvbiB3aGljaCB1cGRhdGVzIHRoZSByb2xlIG9iamVjdC4gRGVmYXVsdCBgX2RlZmF1bHRVcGRhdGVSb2xlYC5cbiAgICogQHBhcmFtIHtCb29sZWFufSBjb252ZXJ0VW5kZXJzY29yZXNUb0RvdHMgU2hvdWxkIHdlIGNvbnZlcnQgdW5kZXJzY29yZXMgdG8gZG90cyBpbiBncm91cCBuYW1lcy5cbiAgICogQGZvciBSb2xlc1xuICAgKiBAcHJpdmF0ZVxuICAgKiBAc3RhdGljXG4gICAqL1xuICBfZm9yd2FyZE1pZ3JhdGU6IGZ1bmN0aW9uICh1cGRhdGVVc2VyLCB1cGRhdGVSb2xlLCBjb252ZXJ0VW5kZXJzY29yZXNUb0RvdHMpIHtcbiAgICB1cGRhdGVVc2VyID0gdXBkYXRlVXNlciB8fCBSb2xlcy5fZGVmYXVsdFVwZGF0ZVVzZXJcbiAgICB1cGRhdGVSb2xlID0gdXBkYXRlUm9sZSB8fCBSb2xlcy5fZGVmYXVsdFVwZGF0ZVJvbGVcblxuICAgIFJvbGVzLl9kcm9wQ29sbGVjdGlvbkluZGV4KE1ldGVvci5yb2xlcywgJ25hbWVfMScpXG5cbiAgICBNZXRlb3Iucm9sZXMuZmluZCgpLmZvckVhY2goZnVuY3Rpb24gKHJvbGUsIGluZGV4LCBjdXJzb3IpIHtcbiAgICAgIGlmICghUm9sZXMuX2lzTmV3Um9sZShyb2xlKSkge1xuICAgICAgICB1cGRhdGVSb2xlKHJvbGUsIFJvbGVzLl9jb252ZXJ0VG9OZXdSb2xlKHJvbGUpKVxuICAgICAgfVxuICAgIH0pXG5cbiAgICBNZXRlb3IudXNlcnMuZmluZCgpLmZvckVhY2goZnVuY3Rpb24gKHVzZXIsIGluZGV4LCBjdXJzb3IpIHtcbiAgICAgIGlmICghUm9sZXMuX2lzTmV3RmllbGQodXNlci5yb2xlcykpIHtcbiAgICAgICAgdXBkYXRlVXNlcihcbiAgICAgICAgICB1c2VyLFxuICAgICAgICAgIFJvbGVzLl9jb252ZXJ0VG9OZXdGaWVsZCh1c2VyLnJvbGVzLCBjb252ZXJ0VW5kZXJzY29yZXNUb0RvdHMpXG4gICAgICAgIClcbiAgICAgIH1cbiAgICB9KVxuICB9LFxuXG4gIC8qKlxuICAgKiBNb3ZlcyB0aGUgYXNzaWdubWVudHMgZnJvbSBgTWV0ZW9yLnVzZXJzYCB0byBgTWV0ZW9yLnJvbGVBc3NpZ25tZW50YC5cbiAgICpcbiAgICogQG1ldGhvZCBfZm9yd2FyZE1pZ3JhdGUyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSB1c2VyU2VsZWN0b3IgQW4gb3Bwb3J0dW5pdHkgdG8gc2hhcmUgdGhlIHdvcmsgYW1vbmcgaW5zdGFuY2VzLiBJdCdzIGFkdmlzYWJsZSB0byBkbyB0aGUgZGl2aXNpb24gYmFzZWQgb24gdXNlci1pZC5cbiAgICogQGZvciBSb2xlc1xuICAgKiBAcHJpdmF0ZVxuICAgKiBAc3RhdGljXG4gICAqL1xuICBfZm9yd2FyZE1pZ3JhdGUyOiBmdW5jdGlvbiAodXNlclNlbGVjdG9yKSB7XG4gICAgdXNlclNlbGVjdG9yID0gdXNlclNlbGVjdG9yIHx8IHt9XG4gICAgT2JqZWN0LmFzc2lnbih1c2VyU2VsZWN0b3IsIHsgcm9sZXM6IHsgJG5lOiBudWxsIH0gfSlcblxuICAgIE1ldGVvci51c2Vycy5maW5kKHVzZXJTZWxlY3RvcikuZm9yRWFjaChmdW5jdGlvbiAodXNlciwgaW5kZXgpIHtcbiAgICAgIHVzZXIucm9sZXNcbiAgICAgICAgLmZpbHRlcigocikgPT4gci5hc3NpZ25lZClcbiAgICAgICAgLmZvckVhY2goKHIpID0+IHtcbiAgICAgICAgICAvLyBBZGRlZCBgaWZFeGlzdHNgIHRvIG1ha2UgaXQgbGVzcyBlcnJvci1wcm9uZVxuICAgICAgICAgIFJvbGVzLl9hZGRVc2VyVG9Sb2xlKHVzZXIuX2lkLCByLl9pZCwge1xuICAgICAgICAgICAgc2NvcGU6IHIuc2NvcGUsXG4gICAgICAgICAgICBpZkV4aXN0czogdHJ1ZVxuICAgICAgICAgIH0pXG4gICAgICAgIH0pXG5cbiAgICAgIE1ldGVvci51c2Vycy51cGRhdGUoeyBfaWQ6IHVzZXIuX2lkIH0sIHsgJHVuc2V0OiB7IHJvbGVzOiAnJyB9IH0pXG4gICAgfSlcblxuICAgIC8vIE5vIG5lZWQgdG8ga2VlcCB0aGUgaW5kZXhlcyBhcm91bmRcbiAgICBSb2xlcy5fZHJvcENvbGxlY3Rpb25JbmRleChNZXRlb3IudXNlcnMsICdyb2xlcy5faWRfMV9yb2xlcy5zY29wZV8xJylcbiAgICBSb2xlcy5fZHJvcENvbGxlY3Rpb25JbmRleChNZXRlb3IudXNlcnMsICdyb2xlcy5zY29wZV8xJylcbiAgfSxcblxuICAvKipcbiAgICogTWlncmF0ZXMgYE1ldGVvci51c2Vyc2AgYW5kIGBNZXRlb3Iucm9sZXNgIHRvIHRoZSBvbGQgZm9ybWF0LlxuICAgKlxuICAgKiBXZSBhc3N1bWUgdGhhdCB3ZSBhcmUgY29udmVydGluZyBiYWNrIGEgZmFpbGVkIG1pZ3JhdGlvbiwgc28gdmFsdWVzIGNhbiBvbmx5IGJlXG4gICAqIHdoYXQgd2VyZSB2YWxpZCB2YWx1ZXMgaW4gdGhlIG9sZCBmb3JtYXQuIFNvIG5vIGdyb3VwIG5hbWVzIHN0YXJ0aW5nIHdpdGggYCRgIGFuZFxuICAgKiBubyBzdWJyb2xlcy5cbiAgICpcbiAgICogQG1ldGhvZCBfYmFja3dhcmRNaWdyYXRlXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IHVwZGF0ZVVzZXIgRnVuY3Rpb24gd2hpY2ggdXBkYXRlcyB0aGUgdXNlciBvYmplY3QuIERlZmF1bHQgYF9kZWZhdWx0VXBkYXRlVXNlcmAuXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IHVwZGF0ZVJvbGUgRnVuY3Rpb24gd2hpY2ggdXBkYXRlcyB0aGUgcm9sZSBvYmplY3QuIERlZmF1bHQgYF9kZWZhdWx0VXBkYXRlUm9sZWAuXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gdXNpbmdHcm91cHMgU2hvdWxkIHdlIHVzZSBncm91cHMgb3Igbm90LlxuICAgKiBAZm9yIFJvbGVzXG4gICAqIEBwcml2YXRlXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIF9iYWNrd2FyZE1pZ3JhdGU6IGZ1bmN0aW9uICh1cGRhdGVVc2VyLCB1cGRhdGVSb2xlLCB1c2luZ0dyb3Vwcykge1xuICAgIHVwZGF0ZVVzZXIgPSB1cGRhdGVVc2VyIHx8IFJvbGVzLl9kZWZhdWx0VXBkYXRlVXNlclxuICAgIHVwZGF0ZVJvbGUgPSB1cGRhdGVSb2xlIHx8IFJvbGVzLl9kZWZhdWx0VXBkYXRlUm9sZVxuXG4gICAgUm9sZXMuX2Ryb3BDb2xsZWN0aW9uSW5kZXgoTWV0ZW9yLnVzZXJzLCAncm9sZXMuX2lkXzFfcm9sZXMuc2NvcGVfMScpXG4gICAgUm9sZXMuX2Ryb3BDb2xsZWN0aW9uSW5kZXgoTWV0ZW9yLnVzZXJzLCAncm9sZXMuc2NvcGVfMScpXG5cbiAgICBNZXRlb3Iucm9sZXMuZmluZCgpLmZvckVhY2goZnVuY3Rpb24gKHJvbGUsIGluZGV4LCBjdXJzb3IpIHtcbiAgICAgIGlmICghUm9sZXMuX2lzT2xkUm9sZShyb2xlKSkge1xuICAgICAgICB1cGRhdGVSb2xlKHJvbGUsIFJvbGVzLl9jb252ZXJ0VG9PbGRSb2xlKHJvbGUpKVxuICAgICAgfVxuICAgIH0pXG5cbiAgICBNZXRlb3IudXNlcnMuZmluZCgpLmZvckVhY2goZnVuY3Rpb24gKHVzZXIsIGluZGV4LCBjdXJzb3IpIHtcbiAgICAgIGlmICghUm9sZXMuX2lzT2xkRmllbGQodXNlci5yb2xlcykpIHtcbiAgICAgICAgdXBkYXRlVXNlcih1c2VyLCBSb2xlcy5fY29udmVydFRvT2xkRmllbGQodXNlci5yb2xlcywgdXNpbmdHcm91cHMpKVxuICAgICAgfVxuICAgIH0pXG4gIH0sXG5cbiAgLyoqXG4gICAqIE1vdmVzIHRoZSBhc3NpZ25tZW50cyBmcm9tIGBNZXRlb3Iucm9sZUFzc2lnbm1lbnRgIGJhY2sgdG8gdG8gYE1ldGVvci51c2Vyc2AuXG4gICAqXG4gICAqIEBtZXRob2QgX2JhY2t3YXJkTWlncmF0ZTJcbiAgICogQHBhcmFtIHtPYmplY3R9IGFzc2lnbm1lbnRTZWxlY3RvciBBbiBvcHBvcnR1bml0eSB0byBzaGFyZSB0aGUgd29yayBhbW9uZyBpbnN0YW5jZXMuIEl0J3MgYWR2aXNhYmxlIHRvIGRvIHRoZSBkaXZpc2lvbiBiYXNlZCBvbiB1c2VyLWlkLlxuICAgKiBAZm9yIFJvbGVzXG4gICAqIEBwcml2YXRlXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIF9iYWNrd2FyZE1pZ3JhdGUyOiBmdW5jdGlvbiAoYXNzaWdubWVudFNlbGVjdG9yKSB7XG4gICAgYXNzaWdubWVudFNlbGVjdG9yID0gYXNzaWdubWVudFNlbGVjdG9yIHx8IHt9XG5cbiAgICBpZiAoTWV0ZW9yLnVzZXJzLmNyZWF0ZUluZGV4KSB7XG4gICAgICBNZXRlb3IudXNlcnMuY3JlYXRlSW5kZXgoeyAncm9sZXMuX2lkJzogMSwgJ3JvbGVzLnNjb3BlJzogMSB9KVxuICAgICAgTWV0ZW9yLnVzZXJzLmNyZWF0ZUluZGV4KHsgJ3JvbGVzLnNjb3BlJzogMSB9KVxuICAgIH0gZWxzZSB7XG4gICAgICBNZXRlb3IudXNlcnMuX2Vuc3VyZUluZGV4KHsgJ3JvbGVzLl9pZCc6IDEsICdyb2xlcy5zY29wZSc6IDEgfSlcbiAgICAgIE1ldGVvci51c2Vycy5fZW5zdXJlSW5kZXgoeyAncm9sZXMuc2NvcGUnOiAxIH0pXG4gICAgfVxuXG4gICAgTWV0ZW9yLnJvbGVBc3NpZ25tZW50LmZpbmQoYXNzaWdubWVudFNlbGVjdG9yKS5mb3JFYWNoKChyKSA9PiB7XG4gICAgICBjb25zdCByb2xlcyA9IE1ldGVvci51c2Vycy5maW5kT25lKHsgX2lkOiByLnVzZXIuX2lkIH0pLnJvbGVzIHx8IFtdXG5cbiAgICAgIGNvbnN0IGN1cnJlbnRSb2xlID0gcm9sZXMuZmluZChcbiAgICAgICAgKG9sZFJvbGUpID0+IG9sZFJvbGUuX2lkID09PSByLnJvbGUuX2lkICYmIG9sZFJvbGUuc2NvcGUgPT09IHIuc2NvcGVcbiAgICAgIClcbiAgICAgIGlmIChjdXJyZW50Um9sZSkge1xuICAgICAgICBjdXJyZW50Um9sZS5hc3NpZ25lZCA9IHRydWVcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJvbGVzLnB1c2goe1xuICAgICAgICAgIF9pZDogci5yb2xlLl9pZCxcbiAgICAgICAgICBzY29wZTogci5zY29wZSxcbiAgICAgICAgICBhc3NpZ25lZDogdHJ1ZVxuICAgICAgICB9KVxuXG4gICAgICAgIHIuaW5oZXJpdGVkUm9sZXMuZm9yRWFjaCgoaW5oZXJpdGVkUm9sZSkgPT4ge1xuICAgICAgICAgIGNvbnN0IGN1cnJlbnRJbmhlcml0ZWRSb2xlID0gcm9sZXMuZmluZChcbiAgICAgICAgICAgIChvbGRSb2xlKSA9PlxuICAgICAgICAgICAgICBvbGRSb2xlLl9pZCA9PT0gaW5oZXJpdGVkUm9sZS5faWQgJiYgb2xkUm9sZS5zY29wZSA9PT0gci5zY29wZVxuICAgICAgICAgIClcblxuICAgICAgICAgIGlmICghY3VycmVudEluaGVyaXRlZFJvbGUpIHtcbiAgICAgICAgICAgIHJvbGVzLnB1c2goe1xuICAgICAgICAgICAgICBfaWQ6IGluaGVyaXRlZFJvbGUuX2lkLFxuICAgICAgICAgICAgICBzY29wZTogci5zY29wZSxcbiAgICAgICAgICAgICAgYXNzaWduZWQ6IGZhbHNlXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH1cblxuICAgICAgTWV0ZW9yLnVzZXJzLnVwZGF0ZSh7IF9pZDogci51c2VyLl9pZCB9LCB7ICRzZXQ6IHsgcm9sZXMgfSB9KVxuICAgICAgTWV0ZW9yLnJvbGVBc3NpZ25tZW50LnJlbW92ZSh7IF9pZDogci5faWQgfSlcbiAgICB9KVxuICB9XG59KVxuIl19
