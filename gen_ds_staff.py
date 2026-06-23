#!/usr/bin/env python3
"""Generate content/sysdesign/distributed-systems-staff.json."""
import json, os

def badge(label, color="#E95420"):
    bg = f"rgba({','.join(str(int(color[i:i+2],16)) for i in (1,3,5))},0.08)"
    return f'<div style="margin-bottom:16px"><span style="display:inline-block;background:{bg};border:1px solid {color};color:{color};font:700 10px system-ui;padding:3px 10px;border-radius:99px;letter-spacing:.05em">{label}</span></div>'

def mg(items):
    rows = ''.join(f'<div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:8px;padding:14px"><div style="font:700 22px system-ui;color:{c}">{v}</div><div style="font:11px system-ui;color:#64748b;margin-top:2px">{l}</div></div>' for v,l,c in items)
    return f'<div style="margin:16px 0;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">{rows}</div>'

def tb(headers, rows):
    thead = ''.join(f'<th style="padding:10px 12px;border-bottom:2px solid #e2e8f0;color:#475569;font-weight:700">{h}</th>' for h in headers)
    trows = ''
    for i, row in enumerate(rows):
        bg = 'background:#fafafa' if i % 2 else ''
        trows += f'<tr style="border-bottom:1px solid #f1f5f9;{bg}>' + ''.join(f'<td style="padding:9px 12px{f";font-weight:600" if j==0 else ""}">{c}</td>' for j,c in enumerate(row)) + '</tr>'
    return f'<div style="margin:16px 0;overflow-x:auto"><table style="width:100%;border-collapse:collapse;font:12px system-ui,sans-serif"><thead><tr style="background:#f1f5f9;text-align:left">{thead}</tr></thead><tbody>{trows}</tbody></table></div>'

# Build sections as a Python list, then serialize to JSON
sections = []
