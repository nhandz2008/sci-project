#!/usr/bin/env python3
"""Test runner script for SCI backend."""

import os
import sys
import subprocess
from pathlib import Path

def run_tests():
    """Run all tests with proper configuration."""
    
    # Get the backend directory
    backend_dir = Path(__file__).parent
    
    # Change to backend directory
    os.chdir(backend_dir)
    
    # Set environment variables for testing
    os.environ["ENVIRONMENT"] = "test"
    os.environ["SECRET_KEY"] = "test-secret-key-for-testing-only"
    os.environ["POSTGRES_PASSWORD"] = "test-password"
    os.environ["FIRST_SUPERUSER_PASSWORD"] = "test-admin-password"
    
    # Run pytest with coverage
    cmd = [
        "python", "-m", "pytest",
        "tests/",
        "-v",
        "--tb=short",
        "--cov=app",
        "--cov-report=term-missing",
        "--cov-report=html:htmlcov",
        "--cov-report=xml",
        "--junitxml=test-results.xml"
    ]
    
    print("🚀 Running SCI Backend Tests...")
    print(f"📁 Working directory: {backend_dir}")
    print(f"🔧 Command: {' '.join(cmd)}")
    print("=" * 60)
    
    try:
        result = subprocess.run(cmd, check=True)
        print("\n" + "=" * 60)
        print("✅ All tests passed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print("\n" + "=" * 60)
        print(f"❌ Tests failed with exit code: {e.returncode}")
        return False
    except FileNotFoundError:
        print("❌ pytest not found. Please install pytest: pip install pytest pytest-cov")
        return False

def run_specific_test(test_file):
    """Run a specific test file."""
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    os.environ["ENVIRONMENT"] = "test"
    os.environ["SECRET_KEY"] = "test-secret-key-for-testing-only"
    os.environ["POSTGRES_PASSWORD"] = "test-password"
    os.environ["FIRST_SUPERUSER_PASSWORD"] = "test-admin-password"
    
    cmd = [
        "python", "-m", "pytest",
        f"tests/{test_file}",
        "-v",
        "--tb=short"
    ]
    
    print(f"🚀 Running specific test: {test_file}")
    print(f"🔧 Command: {' '.join(cmd)}")
    print("=" * 60)
    
    try:
        result = subprocess.run(cmd, check=True)
        print("\n" + "=" * 60)
        print("✅ Test passed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print("\n" + "=" * 60)
        print(f"❌ Test failed with exit code: {e.returncode}")
        return False

def show_test_summary():
    """Show a summary of all test files."""
    backend_dir = Path(__file__).parent
    tests_dir = backend_dir / "tests"
    
    print("📋 SCI Backend Test Summary")
    print("=" * 60)
    
    if not tests_dir.exists():
        print("❌ Tests directory not found!")
        return
    
    test_files = list(tests_dir.glob("test_*.py"))
    
    if not test_files:
        print("❌ No test files found!")
        return
    
    print(f"📁 Found {len(test_files)} test files:")
    print()
    
    for test_file in sorted(test_files):
        print(f"  • {test_file.name}")
        
        # Count test functions in the file
        try:
            with open(test_file, 'r') as f:
                content = f.read()
                test_count = content.count("def test_")
                print(f"    └── {test_count} test functions")
        except:
            print(f"    └── Unable to count tests")
    
    print()
    print("🎯 Test Categories:")
    print("  • Authentication Routes (test_auth_routes.py)")
    print("  • User Management Routes (test_user_routes.py)")
    print("  • CRUD Operations (test_crud_user.py)")
    print("  • Security Utilities (test_security.py)")
    print("  • FastAPI Dependencies (test_dependencies.py)")
    print("  • Pydantic Schemas (test_schemas.py)")
    print("  • Integration Tests (test_integration.py)")
    print()
    print("🚀 To run all tests: python run_tests.py")
    print("🎯 To run specific test: python run_tests.py <test_file>")
    print("📊 Coverage report will be generated in htmlcov/")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == "--summary":
            show_test_summary()
        else:
            test_file = sys.argv[1]
            if not test_file.endswith(".py"):
                test_file += ".py"
            success = run_specific_test(test_file)
            sys.exit(0 if success else 1)
    else:
        success = run_tests()
        sys.exit(0 if success else 1) 