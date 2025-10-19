# LinnPush
Make the Linnstrument an Ableton Live Session view controller like Ableton Push or Move.

In order to implement it on your Linnstrument, we have to do 2 things : add bits of code in your Linnstrument software and create a Max for Live device to launch/delete/... clips in Ableton Session view.

1. Follow the instructions given in the _Downloading and setting up the Arduino IDE_ section from the official Linnstrument website : https://www.rogerlinndesign.com/support/support-linnstrument-source-code
2. Download the linnstrument-firmware folder from this Github. It contains the official Linnstrument firmware (May 8, 2024 version) with the modifications needed for this project (if you want info on what was modified check mods.txt)
3. Plug in your Linnstrument and transfer the files (don't forget to turn on UPDATE OS mode on your Linnstrument : Global Settings > Actions column). Great now the Linnstrument part is done !
4. Now let's create the Max for Live device : open Ableton Live, drag and drop a MIDI Max for Live device on a track. Put this track in Monitor=In and set MIDI To Linnstrument MIDI.
5. Then click on the Max for Live editing button. This will launch Max for Live editor (may take some time, be patient). Once it's launched, create the following blocks and link them accordingly :

<img width="717" height="242" alt="LinnPushBlocks" src="https://github.com/user-attachments/assets/1245e974-0c91-48e8-a36c-12fdffb19769" />

7. Copy the LinnPushCode.js file from this Github and in the same folder as your MIDI Max for Live Device (usually Ableton>User Library>Presets>MIDI Effects>Max MIDI Effect)
8. Well done you made it !

Note : Max for Live is included by default in Live Suite and it is possible to buy it as an add-on module for Live Standard.

# Work in progress

- add a bang block to reset/match the session view
- remove some not needed scheduleSafe ? And shorten timing (to be able to stop several clips at the same time with success each time ahah)
- when LinnPushMode is left to fast, led is not updated on the Linnstrument matrix... so store MIDI-led-change data until Switch1 is pressed and then send the changes to the Linnstrument (need to modify the js file AND the Linnstrument firmware to make the Switch1-press send some MIDI message)
- copy the led colors of the active clip to the Switch2 (column 0) when it's used
- make the 25th column scene-handler and down-right pad the stop-all-clips button
- switch2 is currently not retriggering once a clip is deleted... but it works with the overdub... weird
