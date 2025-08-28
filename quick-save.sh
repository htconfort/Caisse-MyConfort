#!/bin/bash

# 🔥 SAUVEGARDE RAPIDE - Version Express
# Usage: ./quick-save.sh ou ./quick-save.sh "message"

cd "/Users/brunopriem/CAISSE MYCONFORT/Caisse-MyConfort-3"

if [ -n "$1" ]; then
    ./auto-git-save.sh "$1"
else
    ./auto-git-save.sh "QUICK-SAVE: $(date '+%H:%M')"
fi
