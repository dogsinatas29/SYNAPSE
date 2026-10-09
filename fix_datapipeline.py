import re

with open('src/core/DataPipeline.ts', 'r', encoding='utf-8') as f:
    content = f.read()

old_code = """              const canWrite = tempStream.write(JSON.stringify(outObj) + '\\n');
              if (!canWrite) {
                  await new Promise(r => tempStream.once('drain', () => r(undefined)));
              }
          }
          tempStream.end();"""

new_code = """              const canWrite = tempStream.write(JSON.stringify(outObj) + '\\n');
              if (!canWrite) {
                  await new Promise(r => tempStream.once('drain', () => r(undefined)));
              }
              if (i % 10000 === 0) {
                  await new Promise(resolve => setTimeout(resolve, 0));
              }
          }
          tempStream.end();"""

content = content.replace(old_code, new_code)

with open('src/core/DataPipeline.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("DataPipeline.ts patched.")
