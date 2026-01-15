#!/usr/bin/env python3
"""
Align ELF LOAD segments to 16KB (16384 bytes) for Android 15+ compatibility.
This script modifies the p_align field in program headers.
"""

import sys
import struct
import os
from pathlib import Path

def align_elf_load_segments(filepath, page_size=16384):
    """
    Align all LOAD segments in an ELF file to the specified page size.
    
    Args:
        filepath: Path to the ELF (.so) file
        page_size: Target page size (default: 16384 for 16KB)
    
    Returns:
        True if successful, False otherwise
    """
    try:
        with open(filepath, 'r+b') as f:
            # Read ELF header
            elf_header = f.read(64)
            
            # Check ELF magic
            if elf_header[:4] != b'\x7fELF':
                print(f"❌ {os.path.basename(filepath)}: Not an ELF file")
                return False
            
            # Determine if 32-bit or 64-bit
            ei_class = elf_header[4]
            is_64bit = (ei_class == 2)
            
            # Determine endianness
            ei_data = elf_header[5]
            is_little_endian = (ei_data == 1)
            endian = '<' if is_little_endian else '>'
            
            if is_64bit:
                # 64-bit ELF
                # e_phoff is at offset 32 (8 bytes)
                # e_phentsize is at offset 54 (2 bytes)
                # e_phnum is at offset 56 (2 bytes)
                e_phoff = struct.unpack(endian + 'Q', elf_header[32:40])[0]
                e_phentsize = struct.unpack(endian + 'H', elf_header[54:56])[0]
                e_phnum = struct.unpack(endian + 'H', elf_header[56:58])[0]
                
                # Program header structure for 64-bit
                # p_type: 4 bytes at offset 0
                # p_flags: 4 bytes at offset 4
                # p_offset: 8 bytes at offset 8
                # p_vaddr: 8 bytes at offset 16
                # p_paddr: 8 bytes at offset 24
                # p_filesz: 8 bytes at offset 32
                # p_memsz: 8 bytes at offset 40
                # p_align: 8 bytes at offset 48 <-- This is what we need to change
                p_align_offset = 48
                p_align_fmt = endian + 'Q'
                p_align_size = 8
            else:
                # 32-bit ELF
                e_phoff = struct.unpack(endian + 'I', elf_header[28:32])[0]
                e_phentsize = struct.unpack(endian + 'H', elf_header[42:44])[0]
                e_phnum = struct.unpack(endian + 'H', elf_header[44:46])[0]
                
                # Program header structure for 32-bit
                # p_align: 4 bytes at offset 28
                p_align_offset = 28
                p_align_fmt = endian + 'I'
                p_align_size = 4
            
            modified = False
            PT_LOAD = 1
            
            # Process each program header
            for i in range(e_phnum):
                ph_offset = e_phoff + (i * e_phentsize)
                f.seek(ph_offset)
                
                # Read p_type
                p_type = struct.unpack(endian + 'I', f.read(4))[0]
                
                if p_type == PT_LOAD:
                    # Seek to p_align field
                    f.seek(ph_offset + p_align_offset)
                    current_align = struct.unpack(p_align_fmt, f.read(p_align_size))[0]
                    
                    if current_align != page_size:
                        # Write new alignment
                        f.seek(ph_offset + p_align_offset)
                        f.write(struct.pack(p_align_fmt, page_size))
                        modified = True
            
            if modified:
                return True
            else:
                return True  # Already aligned
                
    except Exception as e:
        print(f"❌ Error processing {os.path.basename(filepath)}: {e}")
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python align_elf_segments.py <path_to_so_file>")
        sys.exit(1)
    
    filepath = sys.argv[1]
    
    if not os.path.exists(filepath):
        print(f"❌ File not found: {filepath}")
        sys.exit(1)
    
    success = align_elf_load_segments(filepath)
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
