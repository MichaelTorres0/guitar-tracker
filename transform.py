#!/usr/bin/env python3
"""
Transform guitar-tracker index.html for Phase 1 enhancements
"""

def transform_file(input_path, output_path):
    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Task 1.1: Fix inconsistencies

    # Change 6-week to 8-week in CSS variable
    content = content.replace('--color-6week:', '--color-8week:')

    # Change color class
    content = content.replace('.color-6week {', '.color-8week {')
    content = content.replace('color-6week', 'color-8week')

    # Change sixweek to eightweek in IDs and references
    content = content.replace('id="sixweekPercent"', 'id="eightweekPercent"')
    content = content.replace('id="sixweekBar"', 'id="eightweekBar"')
    content = content.replace("'sixweek'", "'eightweek'")
    content = content.replace('"sixweek"', '"eightweek"')
    content = content.replace('sixweek:', 'eightweek:')

    # Change labels and text
    content = content.replace('6-Week Tasks', '8-Week Tasks')
    content = content.replace('Every 6 weeks', 'Every 8 weeks')
    content = content.replace('Every 6 Weeks', 'Every 8 Weeks')

    # Change task IDs
    content = content.replace("'6w-", "'8w-")
    content = content.replace('"6w-', '"8w-')
    content = content.replace("id: '6w-", "id: '8w-")

    # Change days from 42 to 56
    content = content.replace('nextDate.setDate(nextDate.getDate() + 42);', 'nextDate.setDate(nextDate.getDate() + 56);')
    content = content.replace('daysSince > 42', 'daysSince > 49')
    content = content.replace('} else if (daysSince > 42) {', '} else if (daysSince > 42) {')  # Keep 42 as warning threshold

    # Change string gauge
    content = content.replace('EJ17 Medium (.013-.056)', 'EJ16 Light (.012-.053)')
    content = content.replace("'D\\'Addario EJ17 Phosphor Bronze Medium (.013-.056)'", "'D\\'Addario EJ16 Phosphor Bronze Light (.012-.053)'")
    content = content.replace('D\'Addario EJ17 Phosphor Bronze Medium (.013-.056)', 'D\'Addario EJ16 Phosphor Bronze Light (.012-.053)')

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Transformed file written to {output_path}")
    print("Replacements completed for Task 1.1")

if __name__ == '__main__':
    transform_file('/home/user/guitar-tracker/index.html', '/home/user/guitar-tracker/index_temp.html')
