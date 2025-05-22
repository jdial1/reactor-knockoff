// Moved from js/app.globals.js

const CM_NAMES = ["K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
const FIND_EXPONENT_REGEX = /(([1-9])(\.([0-9]+))?)e\+([0-9]+)/;

/**
 * Formats a number into a human-readable string with metric prefixes.
 * Example: 12345 -> 12.345K
 * @param {number} num - The number to format.
 * @param {number|null} [places=null] - Number of decimal places to round to.
 *                                     If null, tries to show 3 significant figures or adapts.
 * @returns {string} The formatted number string.
 */
export function fmt(num, places = null) {
    if (num === 0) return "0";
    if (num === null || num === undefined || isNaN(num)) return "NaN";

    const floor_num_str = Math.floor(num).toString();
    let fnum_str; // This will be the final formatted string

    const exponent_match = floor_num_str.match(FIND_EXPONENT_REGEX);

    if (exponent_match) {
        const base_val_str = exponent_match[2]; // The '1' in 1e+9
        const decimal_part_str = exponent_match[4]; // The '23' in 1.23e+9
        const exponent_val = parseInt(exponent_match[5], 10); // The '9' in 1e+9

        const desired_places = places === null ? 3 : places;

        if (exponent_val > (CM_NAMES.length * 3)) { // Beyond "Dc" (3 * 11 = 33 for Dc, so >35)
            fnum_str = `${base_val_str}${decimal_part_str ? `.${decimal_part_str.substring(0, desired_places)}` : ''}e+${exponent_val}`;
        } else {
            let full_num_str = base_val_str;
            if (decimal_part_str) {
                full_num_str += decimal_part_str;
            }
            // Pad with zeros if needed to correctly place decimal for slicing
            full_num_str = full_num_str.padEnd(exponent_val + 1, '0'); 
            
            const characteristic = full_num_str.substring(0, exponent_val % 3 + 1);
            const mantissa = full_num_str.substring(exponent_val % 3 + 1);
            
            let combined_num_str = characteristic;
            if (mantissa.length > 0) {
                combined_num_str += `.${mantissa}`;
            }
            
            let float_val = parseFloat(combined_num_str);
            // Round to desired places
            if (places !== null) {
                 float_val = parseFloat(float_val.toFixed(places));
            } else { // Default rounding for 3 sig figs or less if shorter
                if (characteristic.length === 1 && mantissa.length > 1) float_val = parseFloat(float_val.toFixed(2));
                else if (characteristic.length === 2 && mantissa.length > 0) float_val = parseFloat(float_val.toFixed(1));
                else float_val = parseFloat(float_val.toFixed(0));

            }

            const cm_index = Math.floor(exponent_val / 3) -1;
            fnum_str = `${float_val}${CM_NAMES[cm_index] || `e${exponent_val}`}`; // Fallback to e notation if CM_NAMES is too short
        }
    } else { // Non-exponent path (original logic)
        const num_abs = Math.abs(num);
        if (num_abs < 1000 && places === null) { // For small numbers, show simply if no places defined
             if (Number.isInteger(num)) return num.toString();
             // Show up to 2 decimal places for small non-integers if 'places' is null
             return parseFloat(num.toFixed(2)).toString(); 
        }

        const pow = Math.floor((Math.floor(num_abs).toString().length - 1) / 3) * 3;
        const div_num = num / Math.pow(10, pow);
        
        let rounded_num;
        if (places !== null) {
            rounded_num = parseFloat(div_num.toFixed(places));
        } else {
            // Default to fewer decimal places for larger numbers if 'places' is null
            if (pow >= 6) rounded_num = parseFloat(div_num.toFixed(1)); // M, B, T etc.
            else if (pow >= 3) rounded_num = parseFloat(div_num.toFixed(2)); // K
            else rounded_num = parseFloat(div_num.toFixed(3)); // < K
        }
        
        fnum_str = `${rounded_num}${pow === 0 ? "" : (CM_NAMES[(pow / 3) - 1] || `e${pow}`)}`;
    }

    return fnum_str;
}

console.log('numberFormatting.js loaded');
