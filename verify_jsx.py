import xml.etree.ElementTree as ET

def verify_jsx(filename):
    with open(filename, 'r') as f:
        lines = f.readlines()
    
    # Extract content inside return ( ... );
    # Based on file lines: starts at line 6 (index 5) and ends at line 425 (index 424)
    # Line 6: <div className="container py-5 terms-container">
    # Line 425: </div>
    
    content = "".join(lines[5:425])
    
    # JSX is not valid XML because of things like <img /> vs <img>, or attributes without quotes (rare in my code),
    # or entities.
    # Also attributes like className are fine.
    # unescaped & might be an issue.
    
    # Replace potential issues for XML parsing
    # &nbsp; -> space
    # & -> &amp; (but careful not to double escape)
    
    # Actually, simplest check for unclosed tags is to try to parse it.
    # JSX fragments <> </> are not valid XML. I don't use them here.
    
    try:
        ET.fromstring(content)
        print("JSX Content (as XML) is Valid")
    except ET.ParseError as e:
        print(f"XML Parse Error: {e}")
        # Print context
        lines_content = content.split('\n')
        err_line, err_col = e.position
        print(f"Error at line {err_line}:")
        if err_line <= len(lines_content):
            print(lines_content[err_line-1])
            print(" " * err_col + "^")

if __name__ == "__main__":
    verify_jsx('/home/lupum/Desktop/Chianti/proiect/src/pages/legal/PrivacyPolicy.jsx')
