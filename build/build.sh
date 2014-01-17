#!/bin/bash

function comment(){
    echo "Appending $1 to $FILENAME"
    echo "/*" >> $FILENAME
    echo "* $1" >> $FILENAME
    echo "*/" >> $FILENAME
}

function comment_debug(){
    echo "Appending $1 to $FILENAME_DEBUG"
    echo "/*" >> $FILENAME_DEBUG
    echo "* $1" >> $FILENAME_DEBUG
    echo "*/" >> $FILENAME_DEBUG
}

function compile_js(){
    echo "Compiling $1 to $2"
    java -jar compiler.jar \
    --js $1 \
    --compilation_level SIMPLE_OPTIMIZATIONS \
    --js_output_file $2
}

compile_js "../max.ui.js" "max.ui-min.js"
compile_js "../max.client.js" "max.client-min.js"
compile_js "../max.templates.js" "max.templates-min.js"
compile_js "../max.literals.js" "max.literals-min.js"
compile_js "../max.utils.js" "max.utils-min.js"
compile_js "../libs/jquery.easydate.js" "jquery.easydate-min.js"
compile_js "../libs/hogan.js" "hogan-min.js"
compile_js "../libs/jquery.iecors.js" "jquery.iecors-min.js"
compile_js "../libs/json2.js" "json2-min.js"
compile_js "../libs/stomp.js" "stomp-min.js"

VERSION=`cat ../version`
FILENAME="./js/max.ui-$VERSION.js"
FILENAME_DEBUG="./debug/max.ui-$VERSION-debug.js"
CSS_FILENAME="./css/max.ui-$VERSION.css"


# Create minified js

if [ -e $FILENAME ]
then
    rm $FILENAME
fi
touch $FILENAME

comment "MAX UI v.$VERSION"

comment "sockjs-0.3.min.js"
cat ../libs/sockjs-0.3.min.js >> $FILENAME

comment "stomp.js"
cat stomp-min.js >> $FILENAME

comment "json2"
cat json2-min.js >> $FILENAME

comment "jquery.iecors.js"
cat jquery.iecors-min.js >> $FILENAME

comment "jquery.easydate.js"
cat jquery.easydate-min.js >> $FILENAME

comment "hogan.js"
cat hogan-min.js >> $FILENAME

comment "jquery.mousewheel.js"
cat ../libs/jquery.mousewheel-3.0.6.pack.js >> $FILENAME

comment "max.templates.js"
cat max.templates-min.js >> $FILENAME

comment "max.literals.js"
cat max.literals-min.js >> $FILENAME

comment "max.utils.js"
cat max.utils-min.js >> $FILENAME

comment "max.client.js"
cat max.client-min.js >> $FILENAME

comment "max.ui.js"
cat max.ui-min.js >> $FILENAME

comment "max.loader.js"
cat ../max.loader.js | grep -v '//' >> $FILENAME


echo "$FILENAME build completed."
echo

# Create unminified but joined js version

if [ -e $FILENAME_DEBUG ]
then
    rm $FILENAME_DEBUG
fi
touch $FILENAME_DEBUG

comment_debug "MAX UI v.$VERSION DEBUG"

comment_debug "sockjs-0.3.min.js"
cat ../libs/sockjs-0.3.min.js >> $FILENAME_DEBUG

comment_debug "stomp.js"
cat stomp-min.js >> $FILENAME_DEBUG

comment_debug "json2"
cat json2-min.js >> $FILENAME_DEBUG

comment_debug "jquery.iecors.js"
cat jquery.iecors-min.js >> $FILENAME_DEBUG

comment_debug "jquery.easydate.js"
cat jquery.easydate-min.js >> $FILENAME_DEBUG

comment_debug "hogan.js"
cat hogan-min.js >> $FILENAME_DEBUG

comment_debug "jquery.mousewheel.js"
cat ../libs/jquery.mousewheel-3.0.6.pack.js >> $FILENAME_DEBUG

comment_debug "max.templates.js"
cat ../max.templates.js >> $FILENAME_DEBUG

comment_debug "max.literals.js"
cat ../max.literals.js >> $FILENAME_DEBUG

comment_debug "max.utils.js"
cat ../max.utils.js >> $FILENAME_DEBUG

comment_debug "max.client.js"
cat ../max.client.js >> $FILENAME_DEBUG

comment_debug "max.ui.js"
cat ../max.ui.js >> $FILENAME_DEBUG

comment_debug "max.loader.js"
cat ../max.loader.js | grep -v '//' >> $FILENAME_DEBUG


echo "$FILENAME_DEBUG build completed."
echo

rm -f *min.js

echo "Joining css files"



rm -f $CSS_FILENAME
cp ../font/_maxicons.less $CSS_FILENAME
cat  ../css/max.ui.css >> $CSS_FILENAME



