// Riven Builds
let riven_builds = [];
let riven_build_default = {
    name: 'Base Build',
    base_ad: 56.04,
    base_ad_scale: 3.00,

    abilityorder: 'QEW',
    ability_sheet: [],

    runes_ad: 0.00,
    runes_ad_scale: 0.00,
    runes_lethality: 0.00,

    items_ad: 0.00,
    items_lethality: 0.00,
    items_pen_perc: 0.00,
    items_base_ad_perc: 0.00,
    items_shred_perc: 0.00,
    items_shred_max: 0.00,

    total_lethality: 0.00
}

// Enemy Inputs
let enemy_base_armor = 30.00;
let enemy_base_armor_scale = 4.00;

let enemy_runes_armor = 0.00;
let enemy_runes_armor_scale = 0.00;

let enemy_items_armor = 0.00;

// Enemy Totals
let enemy_total_armor = 0.00;
let enemy_bonus_armor = 0.00;
let current_shred_percent = 0;

// Combo Inputs w/ example Sexy Combo
let combos = [
    {
        name: 'The Sexy Combo',
        hits: 'RTWQS'
    }
];

// Riven Abilities
let ability_p_scale = [0.25, 0.3, 0.35, 0.4, 0.45, 0.5];
let ability_q_flat = [0.00, 10, 30, 50, 70, 90];
let ability_q_scale = [0.00, 0.4, 0.45, 0.5, 0.55, 0.6];
let ability_w_flat = [0.00, 50, 80, 110, 140, 170];
let ability_w_scale = [0.00, 1.0, 1.0, 1.0, 1.0, 1.0];
let ability_r_scale = [0.00, 0.2, 0.2, 0.2];
let ability_s_flat = [0.00, 100, 150, 200];
let ability_s_scale = [0.00, 0.6, 0.6, 0.6];

// Graph Colors
let colors = [{
        border: "rgba(0, 219, 102, 1.0)",
        background: "rgba(0, 219, 102, 0.1)"
    }, {
        border: "rgba(2, 142, 237, 1.0)",
        background: "rgba(2, 142, 237, 0.1)"
    }, {
        border: "rgba(199, 0, 249, 1.0)",
        background: "rgba(199, 0, 249, 0.1)"
    }, {
        border: "rgba(232, 114, 4, 1.0)",
        background: "rgba(232, 114, 4, 0.1)"
    }, {
        border: "rgba(122, 232, 0, 1.0)",
        background: "rgba(122, 232, 0, 0.1)",
    }, {
        border: "rgba(237, 33, 7, 1.0)",
        background: "rgba(237, 33, 7, 0.1)",
    }, {
        border: "rgba(13, 9, 234, 1.0)",
        background: "rgba(13, 9, 234, 0.1)",
    }, {
        border: "rgba(11, 242, 7, 1.0)",
        background: "rgba(11, 242, 7, 0.1)",
    }, {
        border: "rgba(238, 242, 7, 1.0)",
        background: "rgba(238, 242, 7, 0.1)",
}];

// Calculation Variables
let enemy_current_base_armor = 0.00;
let enemy_current_bonus_armor = 0.00;
let passive_counter = 0;
let riven_current_ad = 0.00;

window.onload = function() {
    riven_builds.push(riven_build_default);
    FillAbilitySheet(0); // Make sure the default build is complete
}

window.CalculateResults = function() {
    // ChartJS Fix since old charts sometimes re-appear
    let previous_results = document.getElementById('results');
    let results_parent = previous_results.parentNode;
    previous_results.parentNode.removeChild(previous_results);
    let canvas = document.createElement('canvas');
    canvas.id = 'results';
    canvas.width = 980;
    canvas.height = 600;
    results_parent.appendChild(canvas);

    // Remove ChartJS iFrames
    let previous_charts = document.getElementsByClassName('chartjs-hidden-iframe');
    for (let chart = 0; chart < previous_charts.length; chart++) {
        previous_charts[chart].parentNode.removeChild(previous_charts[chart]);
    }

    LoadEnemyStats();

    let datasets = [];
    let color_counter = 0;
    for (var combo = 0; combo < combos.length; combo++) {
        for (var build = 0; build < riven_builds.length; build++) {
            let dataset = {
                label: riven_builds[build].name + " - " + combos[combo].name,
                data: [],
                borderColor: colors[color_counter].border,
                backgroundColor: colors[color_counter].background
            };
            datasets.push(dataset);
            color_counter++;
        }
    }

    let level_labels = [];
    for (var level = 1; level <= 18; level++) {
        level_labels.push("Level " + level.toString());

        // Set the Enemy's armor given the level up
        GetEnemyTotalArmor(level);

        for (var combo = 0; combo < combos.length; combo++) {
            for (var build = 0; build < riven_builds.length; build++) {
                const current_dataset = combo * riven_builds.length + build;
                datasets[current_dataset].data.push(CalculateComboDamage(combo, level, build));
                passive_counter = 0;

                // Reset the Enemy's armor and shred for next build
                GetEnemyTotalArmor(level);
                current_shred_percent = 0;
            }
        }
    }

    Chart.defaults.global.elements.line.tension = 0;
    const results_div = document.getElementById('results').getContext('2d');
    let results_chart = new Chart(results_div, {
        type: 'line',
        data: {
            labels: level_labels,
            datasets: datasets
        }
    });
}

window.CalculateComboDamage = function(combo_id, level, build_id) {
    let combo_hits = combos[combo_id].hits;
    let total_damage = 0.00;
    let hit_counter = 0;
    for (var hit = 0; hit < combo_hits.length; hit++) {
        let ability = combo_hits[hit];
        let ability_flat_damage = parseFloat(GetAbilityFlatDamage(ability, level, build_id)).toFixed(2);
        let ability_scaled_damage = parseFloat(GetAbilityScaledDamage(ability, level, build_id)).toFixed(2);

        // This doesn't need to be concerned with whether the abilities are leveled or not,
        // Since all abilities will have a level by the time her ultimate's damage isn't 0.
        if (/^[AQWT]$/i.test(ability) && hit_counter < 3) {
            hit_counter++;
        } else if (ability == 'S') {
            ability_flat_damage = +(ability_flat_damage) * (1 + (hit_counter * 0.6667));
            ability_scaled_damage = +(ability_flat_damage) * (1 + (hit_counter * 0.6667));
        }


        if (ability_flat_damage != -1 && ability_scaled_damage != -1) {
            // Extra +'s are required for maintaining variable number type
            let hit_total = +(ability_flat_damage) + +(ability_scaled_damage);

            // Account for Armor here, including lethality and armor pen
            // Armor Shred occurs in the Scaled Damage application, in GetAbilityScaledDamage().
            let armor_penetration_multiplier = +(100 - riven_builds[build_id].items_pen_perc) * 0.01;
            let enemy_unpenetrated_bonus_armor = +(enemy_current_bonus_armor) * armor_penetration_multiplier;
            let enemy_new_armor = +(enemy_current_base_armor) + enemy_unpenetrated_bonus_armor;
            let lethality_reduction = +(riven_builds[build_id].total_lethality) * (0.6 + (0.4 * level/18));
            enemy_new_armor = +(enemy_new_armor) - lethality_reduction;
            let damage_reduction = +(enemy_new_armor)/(+(enemy_new_armor) + 100);

            let final_damage_dealt = hit_total * (1 - damage_reduction);

            total_damage += +(final_damage_dealt);
        }
    }

    return parseFloat(total_damage).toFixed(2);
}

window.GetAbilityFlatDamage = function(ability, level, build_id) {
    let ability_level = 0;
    for (var current_level = 1; current_level <= level; current_level++) {
        if (riven_builds[build_id].ability_sheet[current_level - 1] === ability) {
            ability_level++;
        } else if (ability === 'S' && riven_builds[build_id].ability_sheet[current_level - 1] === 'R') {
            ability_level++;
        }
    }

    if (ability === 'Q') {
        passive_counter++;
        return ability_q_flat[ability_level];
    } else if (ability === 'W') {
        passive_counter++;
        return ability_w_flat[ability_level];
    } else if (ability === 'R') {
        passive_counter++;
        return 0.00;
    } else if (ability === 'S') {
        return ability_s_flat[ability_level];
    } else {
        // This should be hit with E, Tiamat, Autoattacks, and Passive.
        return 0.00;
    }
}

window.GetAbilityScaledDamage = function(ability, level, build_id) {
    let ability_level = 0;
    for (var current_level = 1; current_level <= level; current_level++) {
        if (riven_builds[build_id].ability_sheet[current_level - 1] === ability) {
            ability_level++;
        } else if (ability === 'S' && riven_builds[build_id].ability_sheet[current_level - 1] === 'R') {
            ability_level++;
        }
    }

    let ability_scale = 0.00;

    if (ability === 'Q') {
        ability_scale = ability_q_scale[ability_level];
    } else if (ability === 'W') {
        ability_scale =  ability_w_scale[ability_level];
    } else if (ability === 'R') {
        riven_current_ad = riven_current_ad + (riven_current_ad * ability_r_scale[ability_level])
        return 0.00;
    } else if (ability === 'S') {
        ability_scale =  ability_s_scale[ability_level];
    } else if (ability === 'P') {
        passive_counter++;
        return 0.00;
    } else if (ability === 'T') {
        ability_scale = 1.00;
    } else if (ability === 'A') {
        if (passive_counter > 0) {
            passive_counter--;
            ability_scale = (1 + GetPassiveScale(level)).toFixed(2);
        } else {
            ability_scale = 1.00;
        }
    } else {
        return 0.00;
    }

    if (ability_scale > 0) {
        ShredCurrentArmor(ability, build_id);
    }

    return (GetRivenAD(level, build_id) * ability_scale).toFixed(2);
}

window.GetPassiveScale = function(level) {
    if (level <= 6) {
        return ability_p_scale[0];
    } else if (level <= 9) {
        return ability_p_scale[1];
    } else if (level <= 12) {
        return ability_p_scale[2];
    } else if (level <= 15) {
        return ability_p_scale[3];
    } else if (level <=18) {
        return ability_p_scale[4];
    } else {
        // Hopefully we don't hit here, but need a fallback.
        console.log("There was an issue with the passive's damage calculations");
        return ability_p_scale[0];
    }
}

window.ShredCurrentArmor = function(ability, build) {
    if (/^[AQWST]$/i.test(ability) && current_shred_percent < riven_builds[build].items_shred_max) {
        current_shred_percent += +(riven_builds[build].items_shred_perc);
        const shred_amount = +(riven_builds[build].items_shred_perc * 0.01) * enemy_total_armor;
        enemy_current_base_armor = +(enemy_current_base_armor) - shred_amount;
        enemy_current_bonus_armor = +(enemy_current_bonus_armor) - shred_amount;
    }
}

window.LoadEnemyStats = function() {
    if (document.getElementById('enemy_base_armor').value != '') {
        enemy_base_armor = parseFloat(document.getElementById('enemy_base_armor').value);
    } else {
        enemy_base_armor = 30.00;
    }

    if (document.getElementById('enemy_base_armor_scale').value != '') {
        enemy_base_armor_scale = parseFloat(document.getElementById('enemy_base_armor_scale').value);
    } else {
        enemy_base_armor_scale = 4.00;
    }

    if (document.getElementById('enemy_runes_armor').value != '') {
        enemy_runes_armor = parseFloat(document.getElementById('enemy_runes_armor').value);
    } else {
        enemy_runes_armor = 0.00;
    }

    if (document.getElementById('enemy_runes_armor_scale').value != '') {
        enemy_runes_armor_scale = parseFloat(document.getElementById('enemy_runes_armor_scale').value);
    } else {
        enemy_runes_armor = 0.00;
    }

    if (document.getElementById('enemy_items_armor').value != '') {
        enemy_items_armor = parseFloat(document.getElementById('enemy_items_armor').value);
    } else {
        enemy_items_armor = 0.00;
    }

    // Set the Enemy's total armor at match start.
    GetEnemyTotalArmor(1);
}

window.AddBuild = function() {
    let build_object = {};

    if (document.getElementById('riven_build_name').value != '') {
        build_object.name = document.getElementById('riven_build_name').value;
        document.getElementById('riven_build_name_error').style.display = "none";
    } else {
        document.getElementById('riven_build_name_error').innerHTML = "Must include a Build Name."
        document.getElementById('riven_build_name_error').style.display = "block";
        return;
    }

    if (document.getElementById('riven_base_ad').value != '') {
        build_object.base_ad = parseFloat(document.getElementById('riven_base_ad').value);
    } else {
        build_object.base_ad = riven_build_default.base_ad;
    }

    if (document.getElementById('riven_base_ad_scale').value != '') {
        build_object.base_ad_scale = parseFloat(document.getElementById('riven_base_ad_scale').value);
    } else {
        build_object.base_ad_scale = riven_build_default.base_ad_scale;
    }

    if (document.getElementById('riven_abilityorder').value != '') {
        build_object.abilityorder = document.getElementById('riven_abilityorder').value;
        if (! /^(qew|qwe|wqe|weq|eqw|ewq)$/i.test(build_object.abilityorder)) {
            document.getElementById('riven_abilityorder_error').innerHTML = "The order of abilities may only include Q, W, and E."
            document.getElementById('riven_abilityorder_error').style.display = "block";
            build_object.abilityorder = 'QEW';
        } else {
            document.getElementById('riven_abilityorder_error').style.display = "none";
        }
    } else {
        build_object.abilityorder = riven_build_default.abilityorder;
    }

    if (document.getElementById('riven_runes_ad').value != '') {
        build_object.runes_ad = parseFloat(document.getElementById('riven_runes_ad').value);
    } else {
        build_object.runes_ad = riven_build_default.runes_ad;
    }

    if (document.getElementById('riven_runes_ad_scale').value != '') {
        build_object.runes_ad_scale = parseFloat(document.getElementById('riven_runes_ad_scale').value);
    } else {
        build_object.runes_ad_scale = riven_build_default.runes_ad_scale;
    }

    if (document.getElementById('riven_runes_lethality').value != '') {
        build_object.runes_lethality = parseFloat(document.getElementById('riven_runes_lethality').value);
    } else {
        build_object.runes_lethality = riven_build_default.runes_lethality;
    }

    if (document.getElementById('riven_items_ad').value != '') {
        build_object.items_ad = parseFloat(document.getElementById('riven_items_ad').value);
    } else {
        build_object.items_ad = riven_build_default.items_ad;
    }

    if (document.getElementById('riven_items_lethality').value != '') {
        build_object.items_lethality = parseFloat(document.getElementById('riven_items_lethality').value);
    } else {
        build_object.items_lethality = riven_build_default.items_lethality;
    }

    if (document.getElementById('riven_items_pen_perc').value != '') {
        build_object.items_pen_perc = parseFloat(document.getElementById('riven_items_pen_perc').value);
    } else {
        build_object.items_pen_perc = riven_build_default.items_pen_perc;
    }

    if (document.getElementById('riven_items_base_ad_perc').value != '') {
        build_object.items_base_ad_perc = parseFloat(document.getElementById('riven_items_base_ad_perc').value);
    } else {
        build_object.items_base_ad_perc = riven_build_default.items_base_ad_perc;
    }

    if (document.getElementById('riven_items_shred_perc').value != '') {
        build_object.items_shred_perc = parseFloat(document.getElementById('riven_items_shred_perc').value);
    } else {
        build_object.items_shred_perc = riven_build_default.items_shred_perc;
    }

    if (document.getElementById('riven_items_shred_max').value != '') {
        build_object.items_shred_max = parseFloat(document.getElementById('riven_items_shred_max').value);
    } else {
        build_object.items_shred_max = riven_build_default.items_shred_max;
    }

    build_object.total_lethality = +(parseFloat(build_object.runes_lethality + build_object.items_lethality).toFixed(2));
    riven_builds.push(build_object);
    FillAbilitySheet(riven_builds.length-1);

    let build_number = riven_builds.length;
    let new_build = "<div class='remove_box' onclick='RemoveBuild(\"build" + build_number 
                    + "\")' id='build" + build_number + "'>\n";
    new_build += "\t<div class='remove_name'>" + build_object.name + "</div>\n";
    new_build += "\t<div class='remove_info'>AD @ Lvl 1: " + GetRivenAD(1, build_number-1) + "</div>\n";
    new_build += "\t<div class='remove_info'>AD @ Lvl 18: " + GetRivenAD(18, build_number-1) + "</div>\n";
    new_build += "\t<div class='remove_info'>Lethality: " + build_object.total_lethality + "</div>\n";
    new_build += "\t<div class='remove_info'>Armor Shred / Hit: " + build_object.items_shred_perc + "</div>\n";
    new_build += "\t<div class='remove_info'>Armor Pen: " + build_object.items_pen_perc + "</div>\n";
    new_build += "</div>";

    document.getElementById('builds').innerHTML += new_build;
}

window.RemoveBuild = function(build_id) {
    const build_box = document.getElementById(build_id);
    let build_to_remove = '';
    for (var i = 0; i < build_box.childNodes.length;i++) {
        if (build_box.childNodes[i].className == 'remove_name') {
            build_to_remove = build_box.childNodes[i].innerHTML;
            break;
        }
    }

    for (var i = riven_builds.length-1;i>=0;i--) {
        if (riven_builds[i].name === build_to_remove) {
            riven_builds.splice(i, 1);
            break;
        }
    }

    build_box.parentNode.removeChild(build_box);
}

window.FillAbilitySheet = function(build_id) {
    const ability_priority_1 = riven_builds[build_id].abilityorder[0];
    const ability_priority_2 = riven_builds[build_id].abilityorder[1];
    const ability_priority_3 = riven_builds[build_id].abilityorder[2];

    riven_builds[build_id].ability_sheet = [
        ability_priority_1, // Level 1
        ability_priority_2, // Level 2
        ability_priority_3, // Level 3
        ability_priority_1, // Level 4
        ability_priority_1, // Level 5
        'R',                // Level 6
        ability_priority_1, // Level 7
        ability_priority_2, // Level 8
        ability_priority_1, // Level 9
        ability_priority_2, // Level 10
        'R',                // Level 11
        ability_priority_2, // Level 12
        ability_priority_2, // Level 13
        ability_priority_3, // Level 14
        ability_priority_3, // Level 15
        'R',                // Level 16
        ability_priority_3, // Level 17
        ability_priority_3  // Level 18
    ];
}

window.GetRivenAD = function(level, build_id) {
    const base_ad = riven_builds[build_id].base_ad + (riven_builds[build_id].base_ad_scale * (level - 1));
    const added_base_ad = base_ad * 0.01 * riven_builds[build_id].items_base_ad_perc;
    const rune_ad = riven_builds[build_id].runes_ad + (riven_builds[build_id].runes_ad_scale * (level - 1));
    const item_ad = riven_builds[build_id].items_ad;

    const total_ad = base_ad + added_base_ad + rune_ad + item_ad;

    return parseFloat(total_ad).toFixed(2);
}

window.GetEnemyTotalArmor = function(level) {
    const base_armor = enemy_base_armor + (enemy_base_armor_scale * (level - 1));
    const rune_armor = enemy_runes_armor + (enemy_runes_armor_scale * (level - 1));
    const item_armor = enemy_items_armor;

    enemy_total_armor = (base_armor + rune_armor + item_armor).toFixed(2);
    enemy_bonus_armor = (rune_armor + item_armor).toFixed(2);

    // Useful during Armor Shred calculations
    enemy_current_base_armor = base_armor;
    enemy_current_bonus_armor = (rune_armor + item_armor).toFixed(2);
}

window.AddCombo = function() {
    const combo_number = combos.length + 1;

    const combo_name = document.getElementById('combo_input_name').value;
    const combo_hits = document.getElementById('combo_input_abilities').value;

    if (combo_name == '' || combo_hits == '') {
        document.getElementById('combo_error').innerHTML = "Must enter a Combo Name & Abilities Hit";
        document.getElementById('combo_error').style.display = "block";
        return;
    } else {
        document.getElementById('combo_error').style.display = "none";
    }

    let new_combo = "<div class='remove_box' onclick='RemoveCombo(\"combo" + combo_number 
                    + "\")' id='combo" + combo_number + "'>\n";
    new_combo += "\t<div class='remove_name'>" + combo_name + "</div>\n";
    new_combo += "\t<div class='remove_info'>" + combo_hits.toUpperCase() + "</div>\n";
    new_combo += "</div>";

    document.getElementById('combos').innerHTML += new_combo;

    let combo_object = {
        name: combo_name,
        hits: combo_hits.toUpperCase(),
    };

    combos.push(combo_object);

    document.getElementById('combo_input_name').value = '';
    document.getElementById('combo_input_abilities').value = '';
}

window.RemoveCombo = function(combo_id) {
    const combo_box = document.getElementById(combo_id);
    let combo_to_remove = '';
    for (var i = 0; i < combo_box.childNodes.length;i++) {
        if (combo_box.childNodes[i].className == 'remove_name') {
            combo_to_remove = combo_box.childNodes[i].innerHTML;
            break;
        }
    }

    for (var i = combos.length-1;i>=0;i--) {
        if (combos[i].name === combo_to_remove) {
            combos.splice(i, 1);
            break;
        }
    }

    combo_box.parentNode.removeChild(combo_box);
}

