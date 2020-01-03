const SupportedVersion = 10;

/** Class representing a senML stream */
export default class Senml {
  /**
   * Instancing class
   * @param {array} message - senML message
   * @param {string} format - format
   */
  constructor() {
    // declare resolvedMessage
    this.resolvedMessage = {};
  }

  static get SupportedVersion() {
    return SupportedVersion;
  }

  /**
   * Decode parses the message with the given decoding format
   */
  Decode(message, format) {
    switch (format) {
      case 'json':
        this.message = {};
        if (typeof message === 'string')
          this.message.records = JSON.parse(message);
        else if (typeof message === 'object') this.message.records = message;
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Encode encodes the message with the given encoding format
   */
  Encode(format) {
    switch (format) {
      case 'json':
        return JSON.stringify(this.message.Records);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Resolve adds the base attributes to the normal attributes, calculates absolute time from relative time etc.
   */
  Resolve() {
    if (this.message.records.length === 0)
      throw new Error(`No records to resolve.`);

    const timeNow = Date.now();

    let baseName;
    let baseTime;
    let baseUnit;
    let baseValue;
    let baseSum;
    let baseVersion;

    // Init records
    this.resolvedMessage.Records = [];

    this.message.records.forEach(record => {
      const resolvedRecord = {};
      if (record.bver)
        if (record.bver > SupportedVersion)
          throw new Error(
            `The version of the message is unsupported. (maximum supported version: ${SupportedVersion}, got: ${
              record.BaseVersion
            })`,
          );
        else if (baseVersion === null) baseVersion = record.bver;
        else if (record.bver !== baseVersion)
          throw new Error(
            `The BaseVersion of at least one record differs from the other records. (version used to parse the records: ${baseVersion}, got: ${
              record.bver
            })`,
          );
        else if (baseVersion === null) {
          const defaultVersion = SupportedVersion;
          baseVersion = defaultVersion;
        }
      if (record.bn !== undefined) baseName = record.bn;
      if (record.bt !== undefined) baseTime = record.bt;
      if (record.bu !== undefined) baseUnit = record.bu;
      if (record.bv !== undefined) baseValue = record.bv;
      if (record.bs !== undefined) baseSum = record.bs;

      if (baseName !== undefined || record.n !== undefined) {
        try {
          resolvedRecord.n = this.resolveName(baseName, record.n);
        } catch (e) {
          return e;
        }
      }
      if (baseTime !== undefined || record.t !== undefined)
        resolvedRecord.t = this.resolveTime(baseTime, record.t, timeNow);
      if (baseUnit !== undefined || record.u !== undefined)
        resolvedRecord.u = this.resolveUnit(baseUnit, record.u);
      if (baseValue !== undefined || record.v !== undefined)
        resolvedRecord.v = this.resolveValue(baseValue, record.v);
      if (baseSum !== undefined || record.s !== undefined)
        resolvedRecord.s = this.resolveSum(baseSum, record.s);
      if (record.vb !== undefined)
        resolvedRecord.vb = this.resolveBoolValue(record.vb);
      if (record.vs !== undefined)
        resolvedRecord.vs = this.resolveStringValue(record.vs);
      if (record.vd !== undefined)
        resolvedRecord.vd = this.resolveDataValue(record.vd);
      if (record.ut !== undefined)
        resolvedRecord.ut = this.resolveUpdateTime(record.ut);

      if (!this.validateRecordHasValue(resolvedRecord)) {
        throw new Error(
          'The record has no Value, StringValue, BoolValue, DataValue or Sum field set',
        );
      }

      this.resolvedMessage.Records.push(resolvedRecord);

      return undefined;
    });

    this.setBaseVersionIfNecessary(baseVersion);
    this.sortRecordsChronologically(this.resolvedMessage.Records);

    return this.resolvedMessage;
  }

  /**
   * resolveName
   * @private
   */
  resolveName(baseName, name) {
    let resolvedName = '';

    if (baseName !== undefined) {
      resolvedName = baseName;
    }
    if (name !== undefined) {
      resolvedName += name;
    }

    if (resolvedName.length === 0) {
      throw new Error(
        `The resolved name is invalid. It MUST not be empty to uniquely identify and differentiate the sensor from all others`,
      );
    }
    const validFirstCharacterExp = new RegExp(`^[a-zA-Z0-9]*$`);
    if (!validFirstCharacterExp) {
      throw new Error(
        `The resolved name is invalid. It MUST start with a character out of the set "A" to "Z", "a" to "z", or "0" to "9"`,
      );
    }
    const validNameCharsExp = new RegExp(`^[a-zA-Z0-9-:./_]*$`);
    if (!validNameCharsExp) {
      throw new Error(
        `The resolved name is invalid. It MUST consist only of characters out of the set "A" to "Z", "a" to "z", and "0" to "9", as well as "-", ":", ".", "/", and "_"`,
      );
    }
    return resolvedName;
  }

  /**
   * resolveUnit
   * @private
   */
  resolveUnit(baseUnit, unit) {
    let resolvedUnit = '';
    if (unit !== undefined) {
      resolvedUnit = unit;
    } else if (baseUnit !== undefined) {
      resolvedUnit = baseUnit;
    }
    return resolvedUnit;
  }

  /**
   * resolveValue
   * @private
   */
  resolveValue(baseValue, value) {
    let resolvedValue = 0;

    if (baseValue !== undefined) {
      resolvedValue = baseValue;
    }
    if (value !== undefined) {
      resolvedValue += value;
    }
    if (baseValue !== undefined || value !== undefined) {
      return resolvedValue;
    }

    return undefined;
  }

  /**
   * resolveBoolValue
   * @private
   */
  resolveBoolValue(value) {
    let resolvedBoolValue;
    if (value !== undefined) {
      resolvedBoolValue = value;
    }
    return resolvedBoolValue;
  }

  /**
   * resolveStringValue
   * @private
   */
  resolveStringValue(value) {
    let resolvedStringValue;
    if (value !== undefined) {
      resolvedStringValue = value;
    }
    return resolvedStringValue;
  }

  /**
   * resolveDataValue
   * @private
   */
  resolveDataValue(value) {
    let resolvedDataValue;
    if (value !== undefined) {
      resolvedDataValue = value;
    }
    return resolvedDataValue;
  }

  /**
   * resolveSum
   * @private
   */
  resolveSum(baseSum, sum) {
    let resolvedSum = 0;
    if (baseSum !== undefined) {
      resolvedSum = baseSum;
    }
    if (sum !== undefined) {
      resolvedSum += sum;
    }
    return resolvedSum;
  }

  /**
   * resolveTime
   * @private
   */
  resolveTime(baseTime, time, timeNow) {
    let resolvedTime = 0;
    if (baseTime !== undefined) {
      resolvedTime = baseTime;
    }
    if (time !== undefined) {
      resolvedTime += time;
    }
    if (resolvedTime < 2 ** 28) {
      resolvedTime += timeNow;
    }
    return resolvedTime;
  }

  /**
   * resolveUpdateTime
   * @private
   */
  resolveUpdateTime(updateTime) {
    let resolvedUpdateTime;
    if (updateTime !== undefined) {
      resolvedUpdateTime = updateTime;
    }
    return resolvedUpdateTime;
  }

  /**
   * validateRecordHasValue
   * @private
   */
  validateRecordHasValue(record) {
    if (
      record.v === undefined &&
      record.vs === undefined &&
      record.vb === undefined &&
      record.vd === undefined &&
      record.s === undefined
    ) {
      return false;
    }
    return true;
  }

  /**
   * setBaseVersionIfNecessary
   * @private
   */
  setBaseVersionIfNecessary(baseVersion) {
    if (baseVersion !== undefined && baseVersion < SupportedVersion) {
      this.resolvedMessage.records.map(record => {
        const newRecord = record;
        newRecord.BaseVersion = baseVersion;
        return newRecord;
      });
    }
  }

  /**
   * sortRecordsChronologically
   * @private
   */
  sortRecordsChronologically(records) {
    return records.sort((a, b) => parseFloat(a.Time) - parseFloat(b.Time));
  }
}
