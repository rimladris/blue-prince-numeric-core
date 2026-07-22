// Core solver for the Blue Prince numeric core puzzle.
// Rule: given 4 values (each either a single digit 0-9, a letter A=1..Z=26,
// or an arbitrary whole number typed directly), assign one operation to each
// value in order. The first operation is always '+'. The remaining three
// operations are some ordering of {-, *, /}. Operations are applied strictly
// left-to-right (no normal order of operations) as a running total starting
// from 0. Among all orderings that yield a non-negative integer, the numeric
// core is the minimum such result. If the result has 4 or more digits, the
// process repeats using that result's digits as the new 4-value input.

// Parses a 4-letter code (each char A-Z) into 4 values. This is the "PEAK"
// style input. Digits are still accepted per-character for flexibility, but
// valuesFromAnyInput blocks bare all-digit strings before they get here,
// since e.g. "1942" is ambiguous (four digits, vs. one number).
function valuesFromCode(input) {
  const chars = input.trim().toUpperCase().split('');
  if (chars.length !== 4) {
    throw new Error(`Code must be exactly 4 characters (got ${chars.length}).`);
  }
  return chars.map((c) => {
    if (/[0-9]/.test(c)) return Number(c);
    if (/[A-Z]/.test(c)) return c.charCodeAt(0) - 64; // A=1 ... Z=26
    throw new Error(`Invalid character: "${c}". Use digits 0-9 or letters A-Z.`);
  });
}

// Validates 4 raw numbers (each value can be any non-negative whole number,
// not limited to a single digit). This is for inputs where a "digit" of the
// puzzle is itself a multi-digit number, e.g. [19, 4, 8, 23].
function valuesFromNumbers(nums) {
  if (nums.length !== 4) {
    throw new Error(`Expected exactly 4 numbers (got ${nums.length}).`);
  }
  return nums.map((n, i) => {
    const num = Number(n);
    if (!Number.isInteger(num) || num < 0 || `${n}`.trim() === '') {
      throw new Error(`Value ${i + 1} must be a non-negative whole number (got "${n}").`);
    }
    return num;
  });
}

// Parses a single free-form input box: if it contains a space or comma,
// it's treated as 4 separated numbers (e.g. "16, 5, 1, 11" or "16 5 1 11").
// Otherwise it's treated as a 4-letter code (e.g. "PEAK"). A bare all-digit
// string like "1942" is rejected rather than silently read as 4 digits,
// since that reading is ambiguous with "the number 1942" — numbers always
// need explicit separators.
function valuesFromAnyInput(raw) {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new Error('Enter a 4-letter code (e.g. PEAK) or 4 numbers separated by spaces/commas (e.g. 16,5,1,11).');
  }
  if (/[\s,]/.test(trimmed)) {
    const tokens = trimmed.split(/[\s,]+/).filter((t) => t.length > 0);
    return valuesFromNumbers(tokens);
  }
  if (/^[0-9]+$/.test(trimmed)) {
    throw new Error('For numbers, separate them with spaces or commas (e.g. 1,9,4,2) — plain digit strings like this aren\'t accepted.');
  }
  return valuesFromCode(trimmed);
}

function permutations(arr) {
  if (arr.length <= 1) return [arr];
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const p of permutations(rest)) result.push([arr[i], ...p]);
  }
  return result;
}

// Applies a 4-op sequence to 4 values left-to-right, starting from 0.
// Returns null if a division by zero occurs (that ordering is invalid).
function applyOps(values, ops) {
  let acc = 0;
  const steps = [];
  for (let i = 0; i < values.length; i++) {
    const op = ops[i];
    const v = values[i];
    const before = acc;
    let next;
    switch (op) {
      case '+': next = acc + v; break;
      case '-': next = acc - v; break;
      case '*': next = acc * v; break;
      case '/':
        if (v === 0) return null;
        next = acc / v;
        break;
      default:
        throw new Error(`Unknown operation: ${op}`);
    }
    steps.push({ op, value: v, before, after: next });
    acc = next;
  }
  return { result: acc, steps };
}

// Finds the minimum non-negative integer result across all valid orderings
// (first op fixed as '+', remaining ops a permutation of the rest of the set).
function solveRound(values) {
  const remainingOps = ['-', '*', '/'];
  const orderings = permutations(remainingOps);
  const candidates = [];
  for (const rest of orderings) {
    const ops = ['+', ...rest];
    const outcome = applyOps(values, ops);
    if (outcome === null) continue;
    if (Number.isInteger(outcome.result) && outcome.result >= 0) {
      candidates.push({ ops, ...outcome });
    }
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.result - b.result);
  return candidates[0];
}

function digitsOf(n) {
  return String(n).split('').map(Number);
}

// Runs the full process on 4 already-parsed values, recursing when a round's
// result has 4+ digits. Returns { rounds, core } on success, or
// { rounds, error } if some round has no valid non-negative integer ordering.
function computeNumericCoreForValues(values) {
  const rounds = [];
  let roundNum = 1;

  while (true) {
    const best = solveRound(values);
    if (!best) {
      return {
        rounds,
        error: `No ordering of operations produces a non-negative integer for [${values.join(', ')}] (pass ${roundNum}).`,
      };
    }
    const warning = best.result === 0 ? 'Result is zero.' : null;
    rounds.push({ round: roundNum, inputValues: values, ...best, warning });

    if (best.result < 1000) {
      return { rounds, core: best.result };
    }
    values = digitsOf(best.result);
    roundNum++;
  }
}

// Convenience wrapper for the "code" input mode (e.g. "PEAK").
function computeNumericCore(input) {
  return computeNumericCoreForValues(valuesFromCode(input));
}

// Convenience wrapper for the "4 numbers" input mode (e.g. [19, 4, 8, 23]).
function computeNumericCoreFromNumbers(nums) {
  return computeNumericCoreForValues(valuesFromNumbers(nums));
}

// Convenience wrapper for a single free-form input box that auto-detects
// code vs. separated-numbers format (see valuesFromAnyInput).
function computeNumericCoreFromAnyInput(raw) {
  return computeNumericCoreForValues(valuesFromAnyInput(raw));
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    valuesFromCode,
    valuesFromNumbers,
    valuesFromAnyInput,
    permutations,
    applyOps,
    solveRound,
    digitsOf,
    computeNumericCoreForValues,
    computeNumericCore,
    computeNumericCoreFromNumbers,
    computeNumericCoreFromAnyInput,
  };
}
