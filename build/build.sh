#!/bin/bash
#echo "Compiling jquery 1.7.1"
#java -jar closure-compiler-v1346.jar --js ../jquery-1.7.1.js --compilation_level SIMPLE_OPTIMIZATIONS --js_output_file jquery-1.7.1-min.js
echo "Compiling max.ui.js"
java -jar closure-compiler-v1346.jar --js ../max.ui.js --compilation_level SIMPLE_OPTIMIZATIONS --js_output_file max.ui-min.js
echo "Compiling max.client.js"
java -jar closure-compiler-v1346.jar --js ../max.client.js --compilation_level SIMPLE_OPTIMIZATIONS --js_output_file max.client-min.js
echo "compiling max.templates.js"
java -jar closure-compiler-v1346.jar --js ../max.templates.js --compilation_level SIMPLE_OPTIMIZATIONS --js_output_file max.templates-min.js
echo "compiling max.literals.js"
java -jar closure-compiler-v1346.jar --js ../max.literals.js --compilation_level SIMPLE_OPTIMIZATIONS --js_output_file max.literals-min.js
echo "compiling max.utils.js"
java -jar closure-compiler-v1346.jar --js ../max.utils.js --compilation_level SIMPLE_OPTIMIZATIONS --js_output_file max.utils-min.js
echo "Compiling jquery.easydate.js"
java -jar closure-compiler-v1346.jar --js ../libs/jquery.easydate.js --compilation_level SIMPLE_OPTIMIZATIONS --js_output_file jquery.easydate-min.js
echo "Compiling hogan.js"
java -jar closure-compiler-v1346.jar --js ../libs/hogan.js --compilation_level SIMPLE_OPTIMIZATIONS --js_output_file hogan-min.js
echo "Compiling jquery.iecors.js"
java -jar closure-compiler-v1346.jar --js ../libs/jquery.iecors.js --compilation_level SIMPLE_OPTIMIZATIONS --js_output_file jquery.iecors-min.js
echo "Compiling json2.js"
java -jar closure-compiler-v1346.jar --js ../libs/json2.js --compilation_level SIMPLE_OPTIMIZATIONS --js_output_file json2-min.js
# echo "Compiling socket.io.js"
# java -jar closure-compiler-v1346.jar --js ../libs/socket.io.js --compilation_level SIMPLE_OPTIMIZATIONS --js_output_file socket.io-min.js
echo "Compiling stomp.js"
java -jar closure-compiler-v1346.jar --js ../libs/stomp.js --compilation_level SIMPLE_OPTIMIZATIONS --js_output_file stomp-min.js
echo "Compiling jquery.mousewheel.js"
java -jar closure-compiler-v1346.jar --js ../libs/jquery.mousewheel-3.0.6.pack.js --compilation_level SIMPLE_OPTIMIZATIONS --js_output_file jquery.mousewheel-min.js
echo "Compiling jquery.jscrollpane.js"
java -jar closure-compiler-v1346.jar --js ../libs/jquery.jscrollpane.js --compilation_level SIMPLE_OPTIMIZATIONS --js_output_file jquery.jscrollpane-min.js



VERSION=`cat ../version`
FILENAME="max.ui-$VERSION.js"

if [ -e $FILENAME ]
then
    rm $FILENAME
fi
touch $FILENAME

function comment(){
    echo "Appending $1 to $FILENAME"
    echo "/*" >> $FILENAME
    echo "* $1" >> $FILENAME
    echo "*/" >> $FILENAME
}


#comment "jQuery 1.7.1"
#cat jquery-1.7.1-min.js >> $FILENAME

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

# comment "socket.io.js"
# cat socket.io-min.js >> $FILENAME

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

