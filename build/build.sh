#!/bin/bash

function comment(){
    echo "Appending $1 to $FILENAME"
    echo "/*" >> $FILENAME
    echo "* $1" >> $FILENAME
    echo "*/" >> $FILENAME
}

function compile_js(){
    echo "Compiling $1 to $2"
    java -jar compiler.jar \
    --js $1 \
    --compilation_level ADVANCED_OPTIMIZATIONS \
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
compile_js "../libs/jquery.mousewheel-3.0.6.pack.js" "jquery.mousewheel-min.js"

VERSION=`cat ../version`
FILENAME="max.ui-$VERSION.js"

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
cat jquery.mousewheel-min.js >> $FILENAME

comment "jquery.jscrollpane.js"
cat jquery.jscrollpane-min.js >> $FILENAME

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

