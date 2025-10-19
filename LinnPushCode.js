autowatch = 1;
inlets = 1;
outlets = 1;

// === CONFIG ===
var DOUBLE_PRESS_MS = 200;
var LONG_PRESS_MS   = 400;

var ARM_DELAY_MS = 20;
var FIRE_DELAY_MS = 20;
var DEL_DELAY_MS = 20;
var STOP_DELAY_MS = 20;

var MIDI_STATUS_CC = 0xB0; // 176, standard for MIDI Control Change on channel 1

// === Linnstrument LED COLORS ===
var RED = 1;
var GREEN = 3;
var CYAN = 4;
var OFF = 7;
var WHITE = 8;

// === STATE ===
var currentCol = -1;
var currentRow = -1;
var sideButton = null; // {col, row}

var trackEmpty=true;

var pendingTasks = [];

var pressTimers = {}; // dict with col_row as key and { task, pressTime, count } as value

// === TASKS HANDLER ===
function scheduleSafe(fn, delay) {
    var t = new Task(function() {
        try { fn(); } catch(e) { /*post("task error:", e, "\n");*/ }
    }, this);
    pendingTasks.push(t);
    t.schedule(delay);
    return t;
}

// === HELPERS ===
function isValidObj(col,row){
    if (typeof row === "undefined") {row = -1;}// post("no row given");}
    if (col==-1) return false;
    try{
    var song = new LiveAPI("live_set");
    var nTracks = song.getcount("tracks");
    if (col >= 1 && col < nTracks){
        if (row != -1){
            var track = new LiveAPI(null, "live_set tracks " + col);
            var nClips = track.getcount("clip_slots");
            if (row >= 0 && row <= nClips) return true;
            return false;
        }
        return true;
    }
    return false; 
    } catch(e) {/*post("Validating error"); return false;*/}
}

// === CC22 & CC23 ===
function cc_handle(val) {
    if (val==127) {
        padPress(currentCol, currentRow);
    } else {
        padRelease(currentCol, currentRow);
    }
}

// === PAD BEHAVIOR ===
function padPress(col, row) {
    var k = col + "_" + row;
    var now = new Date().getTime();
    if (!pressTimers[k]) { // create if not existing
        pressTimers[k] = {task:false,pressTime:0,count:0};
    }
    pressTimers[k].count++;
    pressTimers[k].pressTime = now;

    // schedule long press
    if (pressTimers[k].task) pressTimers[k].task.cancel();
    pressTimers[k].task = new Task(function() {
        if (new Date().getTime() - pressTimers[k].pressTime >= LONG_PRESS_MS) {
            handleLongPress(col, row);
            pressTimers[k].count = 0; // consume
        }
    }, this);
    pressTimers[k].task.schedule(LONG_PRESS_MS);
}

function padRelease(col, row) {
    var k = col + "_" + row;
    if (!pressTimers[k]) return;
    if (pressTimers[k].task) pressTimers[k].task.cancel();
    if (new Date().getTime() - pressTimers[k].pressTime < LONG_PRESS_MS) {
        // short release: could be single or double
        if (pressTimers[k].count == 1) {
            // wait for possible double press
            pressTimers[k].task = new Task(function() {
                handleSinglePress(col, row);
                pressTimers[k].count = 0;
            }, this);
            pressTimers[k].task.schedule(DOUBLE_PRESS_MS);
        } else if (pressTimers[k].count == 2) {
            pressTimers[k].task = new Task(function() {
                handleDoublePress(col, row);
                pressTimers[k].count = 0;
            }, this);
            pressTimers[k].task.schedule(DOUBLE_PRESS_MS);
        }
    }
}

// === SEND CC FOR COLOR EDITING ON LINNSTRUMENT ===

function sendCC(cc, value){
    // Use 'midievent' triple format to be compatible with [midiout]
    outlet(0, [MIDI_STATUS_CC, cc, value]);
}

function sendClipState(col, row, state){
    sendCC(20, col);
    sendCC(21, 7-row);
    sendCC(22, state);
}

// === CLIP/TRACK ACTORS ===
function armTrack(col){
    try {
        var song = new LiveAPI(null, "live_set");
        var nTracks = song.getcount("tracks");
        for (var i = 1; i < nTracks; i++) {
            if (i === col) continue;
            var ti = new LiveAPI(null, "live_set tracks " + i);
            if (ti !== null) { // unarm all other tracks
                ti.set("arm", 0); // unuseful bcs arming a track will unarm all others
                sendClipState(i, 7, CYAN);
                post('Unarming track ',i);
            }
        }
        
        sendClipState(col, 7, RED);
        scheduleSafe(function() {
            var t = new LiveAPI(null, "live_set tracks " + col);
            t.set("arm", 1);            
        }, ARM_DELAY_MS);
        post("Armed " + col+"\n");
    } catch(e) { /*post("arm error:", e, "\n");*/ }
}

// === ACTIONS ===
function handleSinglePress(col, row) {
    var song = new LiveAPI("live_set");
    song.set("session_record", 0); // disable session record button

    if (row === 7) { // normal press row 7 => arm track
        armTrack(col);
    }
    else{ // normal press other pad => fire clip
        try {
            armTrack(col);
            post("for firing");
            var c = new LiveAPI(null, "live_set tracks " + col + " clip_slots " + row);
            if (c.get("has_clip")[0] == 1) {sendClipState(col, row, WHITE); sendClipState(0,5,WHITE);}
            else {sendClipState(col, row, RED); sendClipState(0,5,RED);}
            scheduleSafe(function() {c.call("fire");}, FIRE_DELAY_MS);
            post("Fired clip col " + col + " row " + row + "\n");
	    }catch(e) { /*post("fire error:", e, "\n");*/ }
    }
}

function handleDoublePress(col, row) {
    var song = new LiveAPI("live_set");
    song.set("session_record", 0); // disable session record button

    if (row === 7) { // delete all clips in track
        try {
            scheduleSafe(function() {
                var t = new LiveAPI(null, "live_set tracks " + col);
                var count = t.getcount("clip_slots");
                for (var i=0;i<count;i++) {
                    var c = new LiveAPI(null, "live_set tracks " + col + " clip_slots " + i);
                    if (c.get("has_clip")[0] == 1) {
                        sendClipState(col, i, OFF);
                        c.call("delete_clip");
                    }
                }
            }, DEL_DELAY_MS);
            post("Deleted all clips on track " + col + "\n");
        }catch(e) { /*post("del error:", e, "\n");*/ }
        return;
    }
    else{ // delete specific clip
        sendClipState(col, row, OFF); // put here to turn off LED even if track doesnt exist
        sendClipState(0,5,OFF);
        try {
            scheduleSafe(function() {
                var c = new LiveAPI(null, "live_set tracks " + col + " clip_slots " + row);
                if (c.get("has_clip")[0] == 1) {
                    c.call("delete_clip");
                }
            },DEL_DELAY_MS);
            post("Deleted clip col " + col + " row " + row + "\n");
        } catch(e) {}
    }
}

function handleLongPress(col, row) {
    if (row === 7) { // stop all clips on this track
        try {
            var t = new LiveAPI(null, "live_set tracks " + col);
            scheduleSafe(function() {
                t.call("stop_all_clips");
            },STOP_DELAY_MS);
            post("Stopped all clips on track " + col + "\n");
        } catch(e) {}
    }
    else{ // arm, overdub, fire clip
        try {
            sendClipState(col, row, RED);
            sendClipState(0,5,RED);
            armTrack(col);
            var song = new LiveAPI("live_set");
            song.set("session_record", 1);
            var c = new LiveAPI(null, "live_set tracks " + col + " clip_slots " + row);
            c.call("fire");
            post("Overdub+fire col " + col + " row " + row + "\n");
        } catch(e) {/*post("overdub error:", e, "\n");*/ }
    }
}

// === MAIN ===
function list() {
    if (arguments.length != 2) return;
    var cc = arguments[0];
    var val = arguments[1];

    post("currentCol ",currentCol,"currentRow ",currentRow,'\n');

    switch(cc) {
        case 20: // if (valid(col,row))
            if (isValidObj(val+1)){
                currentCol = val+1; // +1 to avoid the 8 control panel buttons
                post("n° col",currentCol);
                isValidPad=true;
                post("valid pad (col)");
            } 
            else isValidPad=false; post("not valid pad (col)");
            break;
        case 21: 
            if (isValidObj(currentCol,val) && isValidPad){
                currentRow = val;
                post("n° row",currentRow); 
                isValidPad=true;
                post("valid pad (row)");
            }
            else isValidPad=false; post("not valid pad (row)");
            break;
        case 22: 
            if (isValidObj(currentCol,currentRow) && isValidPad){
                cc_handle(val);
                post("handle 22");
                break;
            }
        case 23: // Side button
            if (isValidObj(currentCol,currentRow) && isValidPad){
                var t = new LiveAPI(null, "live_set tracks " + currentCol);
                var count = t.getcount("clip_slots");
                for (var i=0;i<count;i++) {
                    var c = new LiveAPI(null, "live_set tracks " + currentCol + " clip_slots " + i);
                    if (c.get("has_clip")[0] == 1) { 
                        cc_handle(val);
                        trackEmpty=false;
                        break;
                    }
                }
                if (trackEmpty){
                    currentRow=0; // if whole track empty => trigger 1st 
                    post("set row to 0");
                    cc_handle(val);
                    trackEmpty=true;
                }
                post("handle 23");
                break;
            }
        default: return;
    }
}