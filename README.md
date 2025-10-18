# LinnPush
Make the Linnstrument an Ableton Live Session view controller like Ableton Push or Move.

In order to implement it on your Linnstrument, we have to do 2 things : add bits of code in your Linnstrument software and create a Max for Live device to launch/delete/... clips in Ableton Session view.

1. Follow the instructions given on the official Linnstrument website to get Linnstrument source code : https://www.rogerlinndesign.com/support/support-linnstrument-source-code
2. Replace the files you downloaded on rogerlinndesign's Github page above with the modified files from the current Github page (if you want info on what was modified check mods.txt)
3. Plug in your Linnstrument and transfer the code (don't forget to turn on UPDATE OS mode on your Linnstrument : Global Settings > Actions column). Great now the Linnstrument part is done !
4. Now let's create the Max for Live device : open Ableton Live, drag and drop a MIDI Max for Live device on a track and click on the editing button. This will launch Max for Live editor (may take some time, be patient).
5. Once it's launched, create the following blocks and link them accordingly :

6. Right click on your js block and paste the js file from this Github.
7. Well done you made it !

Note : Max for Live is included by default in Live Suite and it is possible to buy it as an add-on module for Live Standard.
