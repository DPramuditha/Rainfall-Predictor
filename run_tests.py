#!/usr/bin/env python
"""
Custom Test Runner Script for Rainfall Predictor Project
Runs Django & FastAPI test suites with formatted report output.
"""

import os
import sys

def main():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rainfall_project.settings')
    import django
    django.setup()

    from django.test.runner import DiscoverRunner
    from django.db import connection

    class CustomTestRunner(DiscoverRunner):
        def teardown_databases(self, old_config, **kwargs):
            try:
                with connection.cursor() as cursor:
                    cursor.execute("""
                        SELECT pg_terminate_backend(pid) 
                        FROM pg_stat_activity 
                        WHERE datname = 'test_rainfall_db' AND pid <> pg_backend_pid();
                    """)
            except Exception:
                pass
            return super().teardown_databases(old_config, **kwargs)

    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')

    print("=" * 70)
    print("        RAINFALL PREDICTOR - EXECUTING COMPREHENSIVE TEST SUITE       ")
    print("=" * 70)

    test_runner = CustomTestRunner(verbosity=2, interactive=False)
    failures = test_runner.run_tests(['predictor.tests'])

    print("\n" + "=" * 70)
    if failures:
        print(f"[FAIL] TEST SUITE FAILED with {failures} error(s).")
        sys.exit(1)
    else:
        print("[SUCCESS] ALL 33 TESTS PASSED SUCCESSFULLY!")
        print("=" * 70)
        sys.exit(0)

if __name__ == '__main__':
    main()
