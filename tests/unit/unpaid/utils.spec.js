'use strict';

require('../../init-tests');
const {
  parseUnpaidXml,
} = require('src/api/service/unpaid/utils/unpaid-xml-parser');
const path = require('path');
const fs = require('fs');

describe('UnpaidXmlParser test', () => {
  it('should parse it', async () => {
    const xml = fs.readFileSync(path.resolve('tests/files/unpaid.xml'), 'utf8');

    const result = await parseUnpaidXml(xml);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(117);

    // expect all array elements to be string
    for (const e of result) {
      expect(typeof e).toBe('string');
    }

    expect(result[0]).toBe('F22/0025849');
    expect(result[1]).toBe('F22/0025771');
    expect(result[2]).toBe('F22/0025724');
    expect(result[result.length - 1]).toBe('F22/0019483');
  });
});
