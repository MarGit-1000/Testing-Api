const express = require('express');
const router = express.Router();
const fs = require('fs');

// Variable global yang dibutuhkan dari index.js
let items_secret_key = "PBG892FXX982ABC*";
let encoded_buffer_file = [];
const byteToHex = [];

for (let n = 0; n <= 0xff; ++n) {
    const hexOctet = n.toString(16).padStart(2, "0");
    byteToHex.push(hexOctet);
}

// Helper functions
function write_buffer_number(pos, len, value) {
    for (let a = 0; a < len; a++) {
        encoded_buffer_file[pos + a] = (value >> (a * 8)) & 255;
    }
}

function write_buffer_string(pos, len, value, using_key, item_id) {
    for (let a = 0; a < len; a++) {
        if (using_key) {
            encoded_buffer_file[pos + a] = value.charCodeAt(a) ^ (items_secret_key.charCodeAt((a + item_id) % items_secret_key.length));
        } else {
            encoded_buffer_file[pos + a] = value.charCodeAt(a);
        }
    }
}

function hexStringToArrayBuffer(pos, hexString) {
    hexString = hexString.replace(/ /g, '');
    if (hexString.length % 2 != 0) {
        console.log('WARNING: expecting an even number of characters in the hexString');
    }

    var bad = hexString.match(/[G-Z\s]/i);
    if (bad) {
        console.log('WARNING: found non-hex characters', bad);
    }

    hexString.match(/[\dA-F]{2}/gi).map(function(s) {
        encoded_buffer_file[pos++] = parseInt(s, 16);
    });
}

// Main encode function
function process_item_encoder(data) {
    encoded_buffer_file = []; // Reset buffer
    var mem_pos = 6;

    // Write version and item count
    write_buffer_number(0, 2, data.version);
    write_buffer_number(2, 4, data.item_count);

    // Process each item
    for (let a = 0; a < data.item_count; a++) {
        const item = data.items[a];

        // Write item ID
        write_buffer_number(mem_pos, 4, item.item_id);
        mem_pos += 4;

        // Basic properties
        encoded_buffer_file[mem_pos++] = Number(item.editable_type);
        encoded_buffer_file[mem_pos++] = Number(item.item_category);
        encoded_buffer_file[mem_pos++] = Number(item.action_type);
        encoded_buffer_file[mem_pos++] = Number(item.hit_sound_type);

        // Name
        write_buffer_number(mem_pos, 2, item.name.length);
        mem_pos += 2;
        write_buffer_string(mem_pos, item.name.length, item.name, true, Number(item.item_id));
        mem_pos += item.name.length;

        // Texture
        write_buffer_number(mem_pos, 2, item.texture.length);
        mem_pos += 2;
        write_buffer_string(mem_pos, item.texture.length, item.texture);
        mem_pos += item.texture.length;

        // Continue with other properties...
        write_buffer_number(mem_pos, 4, item.texture_hash);
        mem_pos += 4;

        encoded_buffer_file[mem_pos++] = Number(item.item_kind);
        write_buffer_number(mem_pos, 4, item.val1);
        mem_pos += 4;

        // Visual properties
        encoded_buffer_file[mem_pos++] = Number(item.texture_x);
        encoded_buffer_file[mem_pos++] = Number(item.texture_y);
        encoded_buffer_file[mem_pos++] = Number(item.spread_type);
        encoded_buffer_file[mem_pos++] = Number(item.is_stripey_wallpaper);
        encoded_buffer_file[mem_pos++] = Number(item.collision_type);

        // Break hits
        if (item.break_hits.toString().includes("r")) {
            encoded_buffer_file[mem_pos++] = Number(item.break_hits.toString().slice(0, -1));
        } else {
            encoded_buffer_file[mem_pos++] = Number(item.break_hits) * 6;
        }

        // Additional properties
        write_buffer_number(mem_pos, 4, item.drop_chance);
        mem_pos += 4;
        encoded_buffer_file[mem_pos++] = Number(item.clothing_type);
        write_buffer_number(mem_pos, 2, item.rarity);
        mem_pos += 2;
        encoded_buffer_file[mem_pos++] = Number(item.max_amount);

        // Files and hashes
        write_buffer_number(mem_pos, 2, item.extra_file.length);
        mem_pos += 2;
        write_buffer_string(mem_pos, item.extra_file.length, item.extra_file);
        mem_pos += item.extra_file.length;

        write_buffer_number(mem_pos, 4, item.extra_file_hash);
        mem_pos += 4;
        write_buffer_number(mem_pos, 4, item.audio_volume);
        mem_pos += 4;

        // Pet properties
        const petProps = ['pet_name', 'pet_prefix', 'pet_suffix', 'pet_ability'];
        for (const prop of petProps) {
            write_buffer_number(mem_pos, 2, item[prop].length);
            mem_pos += 2;
            write_buffer_string(mem_pos, item[prop].length, item[prop]);
            mem_pos += item[prop].length;
        }

        // Seed and tree properties
        encoded_buffer_file[mem_pos++] = Number(item.seed_base);
        encoded_buffer_file[mem_pos++] = Number(item.seed_overlay);
        encoded_buffer_file[mem_pos++] = Number(item.tree_base);
        encoded_buffer_file[mem_pos++] = Number(item.tree_leaves);

        // Colors
        const seedColor = item.seed_color;
        encoded_buffer_file[mem_pos++] = Number(seedColor.a);
        encoded_buffer_file[mem_pos++] = Number(seedColor.r);
        encoded_buffer_file[mem_pos++] = Number(seedColor.g);
        encoded_buffer_file[mem_pos++] = Number(seedColor.b);

        const seedOverlayColor = item.seed_overlay_color;
        encoded_buffer_file[mem_pos++] = Number(seedOverlayColor.a);
        encoded_buffer_file[mem_pos++] = Number(seedOverlayColor.r);
        encoded_buffer_file[mem_pos++] = Number(seedOverlayColor.g);
        encoded_buffer_file[mem_pos++] = Number(seedOverlayColor.b);

        // Skip ingredients
        write_buffer_number(mem_pos, 4, 0);
        mem_pos += 4;

        // Additional values
        write_buffer_number(mem_pos, 4, item.grow_time);
        mem_pos += 4;
        write_buffer_number(mem_pos, 2, item.val2);
        mem_pos += 2;
        write_buffer_number(mem_pos, 2, item.is_rayman);
        mem_pos += 2;

        // Extra options
        write_buffer_number(mem_pos, 2, item.extra_options.length);
        mem_pos += 2;
        write_buffer_string(mem_pos, item.extra_options.length, item.extra_options);
        mem_pos += item.extra_options.length;

        write_buffer_number(mem_pos, 2, item.texture2.length);
        mem_pos += 2;
        write_buffer_string(mem_pos, item.texture2.length, item.texture2);
        mem_pos += item.texture2.length;

        write_buffer_number(mem_pos, 2, item.extra_options2.length);
        mem_pos += 2;
        write_buffer_string(mem_pos, item.extra_options2.length, item.extra_options2);
        mem_pos += item.extra_options2.length;

        // Position 80 data
        hexStringToArrayBuffer(mem_pos, item.data_position_80);
        mem_pos += 80;

        // Version specific data
        if (data.version >= 11) {
            write_buffer_number(mem_pos, 2, item.punch_options.length);
            mem_pos += 2;
            write_buffer_string(mem_pos, item.punch_options.length, item.punch_options);
            mem_pos += item.punch_options.length;
        }

        if (data.version >= 12) {
            hexStringToArrayBuffer(mem_pos, item.data_version_12);
            mem_pos += 13;
        }

        if (data.version >= 13) {
            write_buffer_number(mem_pos, 4, item.int_version_13);
            mem_pos += 4;
        }

        if (data.version >= 14) {
            write_buffer_number(mem_pos, 4, item.int_version_14);
            mem_pos += 4;
        }

        if (data.version >= 15) {
            hexStringToArrayBuffer(mem_pos, item.data_version_15);
            mem_pos += 25;
            write_buffer_number(mem_pos, 2, item.str_version_15.length);
            mem_pos += 2;
            write_buffer_string(mem_pos, item.str_version_15.length, item.str_version_15);
            mem_pos += item.str_version_15.length;
        }

        if (data.version >= 16) {
            write_buffer_number(mem_pos, 2, item.str_version_16.length);
            mem_pos += 2;
            write_buffer_string(mem_pos, item.str_version_16.length, item.str_version_16);
            mem_pos += item.str_version_16.length;
        }

        if (data.version >= 17) {
            write_buffer_number(mem_pos, 4, item.int_version_17);
            mem_pos += 4;
        }

        if (data.version >= 18) {
            write_buffer_number(mem_pos, 4, item.int_version_18);
            mem_pos += 4;
        }

        if (data.version >= 19) {
            write_buffer_number(mem_pos, 9, item.int_version_19);
            mem_pos += 9;
        }

        if (data.version >= 21) {
            write_buffer_number(mem_pos, 2, item.int_version_21);
            mem_pos += 2;
        }
    }

    return Buffer.from(encoded_buffer_file);
}

// API endpoint
router.post('/encode', express.json(), (req, res) => {
    try {
        const itemsData = req.body;
        if (!itemsData || !itemsData.version || !itemsData.item_count || !itemsData.items) {
            return res.status(400).json({ error: 'Invalid items data format' });
        }

        const datBuffer = process_item_encoder(itemsData);
        
        // Send as downloadable file
        res.set({
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': 'attachment; filename=items.dat'
        });
        
        res.send(datBuffer);
    } catch (error) {
        console.error('Error encoding items:', error);
        res.status(500).json({ error: 'Failed to encode items' });
    }
});

module.exports = router;