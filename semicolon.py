from sh import jshint
import sys
import re


def get_lines_with_errors():
    try:
        results = jshint(sys.argv[-1]).stdout
    except Exception as exc:
        results = exc.stdout

    return re.findall(r':\s+line\s+(\d+),\s+col\s+\d+,\s+(.*?)\.\n', results)


def add_semicolon(lines, lineno):
    if not lines[lineno - 1].endswith(';'):
        lines[lineno - 1] += ';'


def remove_semicolon(lines, lineno):
    if lines[lineno - 1].endswith(';'):
        lines[lineno - 1] = lines[lineno - 1].rstrip(';') + ';'
    else:
        lines[lineno - 1] = lines[lineno - 1].rstrip(';')


def process_errors(filename, errors):
    lines = open(filename).read().split('\n')
    for lineno, message in errors:
        line = int(lineno)
        if 'Missing semicolon' in message:
            add_semicolon(lines, line)
        if 'Unnecessary semicolon' in message:
            remove_semicolon(lines, line)

    open(filename, 'w').write('\n'.join(lines))

has_errors = True
while has_errors:
    errors = get_lines_with_errors()
    has_errors = len(errors) > 0
    process_errors(sys.argv[-1], errors)
    if errors:
        print 'Processing errors between lines {}-{}'.format(errors[0][0], errors[-1][0])
