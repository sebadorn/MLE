#!/bin/bash

FILE=$1

# break line after 5 emotes
# space between emotes
# line break after "{"
# line break after finished list
# line break before list starts, but after the key (list name)
# line break after the last list
# line break before "}"

if [ ${FILE: -5} == ".json" ]; then
	sed -i \
	    -e 's/\(\("[^"]\{1,\}",\)\{5\}\)/\1\n\t\t/g' \
	    -e 's/","/", "/g' \
	    -e 's/{/{\n\t/g' \
	    -e 's/\],/\],\n\t/g' \
	    -e 's/":\[/": \[\n\t\t/g' \
	    -e 's/\]/\n\t\]/g' \
	    -e 's/}/\n}/g' "$FILE"
	echo "Done."
fi
