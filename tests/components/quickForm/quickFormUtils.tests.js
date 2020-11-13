import { expect } from 'chai';
import { restoreAll } from '../../test-utils.tests';
import {
  getSortedFieldGroupNames,
  getFieldsWithNoGroup,
  getFieldsForGroup
} from '../../../components/quickForm/quickFormUtils';

const schemaObject = {
  // ungrouped
  name: String,
  list: Array,
  'list.$': Object,
  'list.$.entry1': String,
  'list.$.entry2': Number,
  complex: Object,
  'complex.foo': String,
  'complex.bar': Number,

  // grouped
  gname: {
    type: String,
    autoform: {
      group: 'foos'
    }
  },
  glist: {
    type: Array,
    autoform: {
      group: 'foos'
    }
  },
  'glist.$': {
    type: Object,
    autoform: {
      group: 'foos'
    }
  },
  'glist.$.entry1': {
    type: String,
    autoform: {
      group: 'foos'
    }
  },
  'glist.$.entry2': {
    type: Number,
    autoform: {
      group: 'foos'
    }
  },
  gcomplex: {
    type: Object,
    autoform: {
      group: 'bars'
    }
  },
  'gcomplex.foo': {
    type: String,
    autoform: {
      group: 'bars'
    }
  },
  'gcomplex.bar': {
    type: Number,
    autoform: {
      group: 'bars'
    }
  },
  'gextra': {
    type: Number,
    autoform: {
      group: 'bars'
    }
  }
}

describe('quickForm - utils', function () {
  afterEach(function () {
    restoreAll();
  });

  describe(getSortedFieldGroupNames.name, function () {
    it("Takes a schema object and returns a sorted array of field group names for it", function () {
      const groupNames = getSortedFieldGroupNames(schemaObject);
      expect(groupNames).to.deep.equal(['bars', 'foos']);
    });
  });

  describe(getFieldsWithNoGroup.name, function () {
    it("Returns the schema field names that don't belong to a group", function () {
      const fieldNames = getFieldsWithNoGroup(schemaObject);
      expect(fieldNames).to.deep.equal([
        'name',
        'list',
        'list.$.entry1',
        'list.$.entry2',
        'complex',
        'complex.foo',
        'complex.bar',
      ]);
    });
  });

  describe(getFieldsForGroup.name, function () {
    it("Returns the schema field names that belong in the group.", function () {
      expect(getFieldsForGroup('noname', schemaObject)).to.deep.equal([]);
      expect(getFieldsForGroup('foos', schemaObject)).to.deep.equal([
        'gname',
        'glist',
        'glist.$.entry1',
        'glist.$.entry2'
      ]);
      expect(getFieldsForGroup('bars', schemaObject)).to.deep.equal([
        'gcomplex',
        'gcomplex.foo',
        'gcomplex.bar',
        'gextra'
      ]);
    });
  });
});
