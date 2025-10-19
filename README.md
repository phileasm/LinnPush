# LinnPush
Make the Linnstrument an Ableton Live Session view controller like Ableton Push or Move.

In order to implement it on your Linnstrument, we have to do 2 things : add bits of code in your Linnstrument software and create a Max for Live device to launch/delete/... clips in Ableton Session view.

1. Follow the instructions given in the _Downloading and setting up the Arduino IDE_ section from the official Linnstrument website : https://www.rogerlinndesign.com/support/support-linnstrument-source-code
2. Download the linnstrument-firmware folder from this Github. It contains the official Linnstrument firmware (May 8, 2024 version) with the modifications needed for this project (if you want info on what was modified check mods.txt)
3. Plug in your Linnstrument and transfer the code (don't forget to turn on UPDATE OS mode on your Linnstrument : Global Settings > Actions column). Great now the Linnstrument part is done !
4. Now let's create the Max for Live device : open Ableton Live, drag and drop a MIDI Max for Live device on a track. Put this track in Monitor=In and set MIDI To Linnstrument.
5. Then click on the editing button. This will launch Max for Live editor (may take some time, be patient). Once it's launched, create the following blocks and link them accordingly :

<img width="717" height="242" alt="LinnPushBlocks" src="https://github.com/user-attachments/assets/1245e974-0c91-48e8-a36c-12fdffb19769" />

7. Right click on your js block and paste the LinnPushCode.js file from this Github and save it in the same folder as your MIDI Max for Live Device (Ableton>User Library>Presets>MIDI Effects>Max MIDI Effect)
8. Well done you made it !

Note : Max for Live is included by default in Live Suite and it is possible to buy it as an add-on module for Live Standard.
