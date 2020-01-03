// import { Senml, SupportedVersion } from './senml.mjs';
const esmRequire = require('esm')(module);

const { Senml } = esmRequire('./index.mjs');

const message1 = [
  { n: 'urn:xxx/temp', t: 1.276020076e9, u: 'Cel', v: 1.0 },
  { n: 'urn:xxx/temp', t: 1.276020077e9, u: 'Cel', v: 1.0 },
  { n: 'urn:xxx/temp', t: 1.276020078e9, u: 'Cel', v: 1.0 },
  { n: 'urn:xxx/temp', t: 1.276020079e9, u: 'Cel', v: 1.0 },
  { n: 'urn:xxx/temp', t: 1.27602008e9, u: 'Cel', v: 1.0 },
];

const message2 = [
  { bn: 'urn:xxx/', n: 'temp', bu: 'Cel', bt: 1.276020076e9, v: 1.0 },
  { n: 'temp', t: 1, v: 1.0 },
  { n: 'temp', t: 2, v: 1.0 },
  { n: 'temp', t: 3, v: 1.0 },
  { n: 'temp', t: 4, v: 1.0 },
];

const result = {
  Records: [
    { n: 'urn:xxx/temp', t: 1276020076, u: 'Cel', v: 1 },
    { n: 'urn:xxx/temp', t: 1276020077, u: 'Cel', v: 1 },
    { n: 'urn:xxx/temp', t: 1276020078, u: 'Cel', v: 1 },
    { n: 'urn:xxx/temp', t: 1276020079, u: 'Cel', v: 1 },
    { n: 'urn:xxx/temp', t: 1276020080, u: 'Cel', v: 1 },
  ],
};

describe('senML parser', () => {
  describe('Constructor', () => {
    test('Success Construct', () => {
      const obj = new Senml();
      expect(obj).not.toThrow();
    });
    test('Format not supported', () => {
      const obj = new Senml();
      expect(obj.Decode(message1, 'cbor')).toThrow(`Unsupported format`);
    });
  });
  describe('resolver', () => {
    test('json resolver standard', () => {
      const obj = new Senml();
      obj.Decode(message1, 'json');
      expect(obj.Resolve()).toEqual(result);
    });
    test('json resolver with baseName', () => {
      const obj = new Senml();
      obj.Decode(message2, 'json');
      expect(obj.Resolve()).toEqual(result);
    });
  });
});
