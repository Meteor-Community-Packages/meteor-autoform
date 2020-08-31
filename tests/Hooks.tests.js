import { Random } from 'meteor/random';
import { expect } from 'chai';
import { Hooks } from '../autoform-hooks';

describe('Hooks', function () {
  beforeEach(function () {
    Hooks.global = Hooks.getDefault();
    Hooks.form = {}
  });

  describe('getDefault', function () {
    it ("creates an empty default object with all hooknames as keys", function () {
      const defaultHooks = Hooks.getDefault();
      expect(defaultHooks).to.deep.equal({
        before: {},
        after: {},
        formToDoc: [],
        formToModifier: [],
        docToForm: [],
        onSubmit: [],
        onSuccess: [],
        onError: [],
        beginSubmit: [],
        endSubmit: []
      });
    });
  });
  describe('addHooksToList', function () {
    it ("throws if a before hook is not a function", function () {
      const hooksList = {
        before: {}
      };

      [
        { before: { 0: undefined } },
        { before: { 0: 1 } },
        { before: { 0: {} } },
        { before: { 0: [] } },
        { before: { 0: true } },
        { before: { 0: "foo" } },
        { before: { 0: new Date() } },
      ].forEach(hooks => {
        expect(() => Hooks.addHooksToList(hooksList, hooks)).to.throw('AutoForm before hook must be a function');
      });
    });
    it ("throws if a after hook is not a function", function () {
      const hooksList = {
        after: {}
      };

      [
        { after: { 0: undefined } },
        { after: { 0: 1 } },
        { after: { 0: {} } },
        { after: { 0: [] } },
        { after: { 0: true } },
        { after: { 0: "foo" } },
        { after: { 0: new Date() } },
      ].forEach(hooks => {
        expect(() => Hooks.addHooksToList(hooksList, hooks)).to.throw('AutoForm after hook must be a function');
      });
    });
    it ("throws if any other hook is not a function", function () {
      const hooksList = {
        formToDoc: [],
        formToModifier: [],
        docToForm: [],
        onSubmit: [],
        onSuccess: [],
        onError: [],
        beginSubmit: [],
        endSubmit: []
      };

      Object.keys(hooksList).forEach(key => {
        [
          { [key]: 1 },
          { [key]: true },
          { [key]: {} },
          { [key]: [] },
          { [key]: "foo" },
          { [key]: new Date() },
        ].forEach(hooks => {
          expect(() => Hooks.addHooksToList(hooksList, hooks)).to.throw(`AutoForm ${key} hook must be a function`);
        });
      })
    });
    it ("adds before hooks", function () {
      const hookId = Random.id();
      const hookFunction = function () {
        return hookId;
      };
      const hooksList = {
        before: {}
      };
      const hooks = {
        before: {
          [hookId]: hookFunction
        }
      };
      Hooks.addHooksToList(hooksList, hooks);
      expect(hooksList).to.deep.equal({
        before: {
          [hookId]: [hookFunction]
        }
      });
    });
    it ("replaces before hooks, if desired", function () {
      const hookId = Random.id();
      const hookFunction = function () {
        return hookId;
      };
      const hooksList = {
        before: {
          [hookId]: [
            hookFunction,
            hookFunction,
            hookFunction,
            hookFunction
          ]
        }
      };
      const hooks = {
        before: {
          [hookId]: hookFunction
        }
      };
      Hooks.addHooksToList(hooksList, hooks, true);
      expect(hooksList).to.deep.equal({
        before: {
          [hookId]: [hookFunction]
        }
      });
    });
    it ("adds after hooks", function () {
      const hookId = Random.id();
      const hookFunction = function () {
        return hookId;
      };
      const hooksList = {
        after: {}
      };
      const hooks = {
        after: {
          [hookId]: hookFunction
        }
      };
      Hooks.addHooksToList(hooksList, hooks);
      expect(hooksList).to.deep.equal({
        after: {
          [hookId]: [hookFunction]
        }
      });
    });
    it ("replaces after hooks, if desired", function () {
      const hookId = Random.id();
      const hookFunction = function () {
        return hookId;
      };
      const hooksList = {
        after: {
          [hookId]: [
            hookFunction,
            hookFunction,
            hookFunction,
            hookFunction
          ]
        }
      };
      const hooks = {
        after: {
          [hookId]: hookFunction
        }
      };
      Hooks.addHooksToList(hooksList, hooks, true);
      expect(hooksList).to.deep.equal({
        after: {
          [hookId]: [hookFunction]
        }
      });
    });
    it ("adds all other hooks", function () {
      const hookId = Random.id();
      const hookFunction = function () {
        return hookId
      };

      const hooksList = {
        formToDoc: [hookFunction],
        formToModifier: [hookFunction],
        docToForm: [hookFunction],
        onSubmit: [hookFunction],
        onSuccess: [hookFunction],
        onError: [hookFunction],
        beginSubmit: [hookFunction],
        endSubmit: [hookFunction]
      };

      Object.keys(hooksList).forEach(key => {
        Hooks.addHooksToList(hooksList, { [key]: hookFunction });
        expect(hooksList[key]).to.deep.equal([
          hookFunction,
          hookFunction
        ]);
      });
    });
    it ("replaces all other hooks, if desired", function () {
      const hookId = Random.id();
      const hookFunction = function () {
        return hookId;
      };

      const hooksList = {
        formToDoc: [hookFunction],
        formToModifier: [hookFunction],
        docToForm: [hookFunction],
        onSubmit: [hookFunction],
        onSuccess: [hookFunction],
        onError: [hookFunction],
        beginSubmit: [hookFunction],
        endSubmit: [hookFunction]
      };

      Object.keys(hooksList).forEach(key => {
        Hooks.addHooksToList(hooksList, { [key]: hookFunction }, true);
        expect(hooksList[key]).to.deep.equal([ hookFunction ]);
      });
    });
  });
  describe('getHooks', function () {
    it ("gets a hook for a given formId and type", function () {
      const formId = Random.id();
      const type = Random.id();
      const hooksFunction = function () {
        return formId
      };

      Hooks.form = {
        [formId]: {
          [type]: [hooksFunction]
        }
      };

      Hooks.global[type] = [hooksFunction];
      expect(Hooks.getHooks(Random.id(), Random.id())).to.deep.equal([])
      expect(Hooks.getHooks(formId, Random.id())).to.deep.equal([])

      expect(Hooks.getHooks(formId, type)).to.deep.equal([
        hooksFunction,
        hooksFunction
      ])
    });
    it ("gets a hook for a given formId, type and subtype", function () {
      const formId = Random.id();
      const subType = Random.id();
      const hooksFunction = function () {
        return formId
      };

      Hooks.form = {
        [formId]: {
          before: {
            [subType]: [hooksFunction]
          }
        }
      };

      Hooks.global.before[subType] = [hooksFunction];
      expect(Hooks.getHooks(formId, 'after', subType)).to.deep.equal([])

      expect(Hooks.getHooks(formId, 'before', subType)).to.deep.equal([
        hooksFunction,
        hooksFunction
      ])
    });
  });
});
