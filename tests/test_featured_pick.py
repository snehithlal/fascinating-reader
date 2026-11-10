"""Offline checks for daily, weekly, and month-end picks."""
import unittest
from datetime import datetime
from unittest.mock import patch
from zoneinfo import ZoneInfo

from reader import server


IST = ZoneInfo("Asia/Kolkata")


class FeaturedPickTests(unittest.TestCase):
    def setUp(self):
        self.old_state = dict(server.PICK_STATE)
        self.old_jobs = dict(server.JOBS)
        server.PICK_STATE.clear()
        server.JOBS.clear()

    def tearDown(self):
        server.PICK_STATE.clear()
        server.PICK_STATE.update(self.old_state)
        server.JOBS.clear()
        server.JOBS.update(self.old_jobs)

    def test_pick_cadence_prefers_month_end_then_friday(self):
        normal = server.featured_pick_spec(datetime(2026, 10, 8, 12, tzinfo=IST))
        friday = server.featured_pick_spec(datetime(2026, 10, 9, 12, tzinfo=IST))
        month_end_friday = server.featured_pick_spec(datetime(2026, 7, 31, 12, tzinfo=IST))
        self.assertEqual((normal["pick_type"], normal["pick_period"]), ("daily", "daily:2026-10-08"))
        self.assertEqual((friday["pick_type"], friday["pick_period"]), ("weekly", "weekly:2026-W41"))
        self.assertEqual((month_end_friday["pick_type"], month_end_friday["pick_period"]),
                         ("monthly", "monthly:2026-07"))

    def test_existing_pick_is_reused_for_its_period(self):
        now = datetime(2026, 10, 9, 12, tzinfo=IST)
        spec = server.featured_pick_spec(now)
        existing = {**spec, "id": "saved-pick", "title": "A topic"}
        self.assertEqual(server.featured_pick_status([existing], now)["status"], "ready")
        self.assertEqual(server.featured_pick_status([existing], now)["lesson_id"], "saved-pick")

    def test_saved_pick_prevents_another_generation_after_restart(self):
        now = datetime(2026, 10, 9, 12, tzinfo=IST)
        existing = {**server.featured_pick_spec(now), "id": "saved-pick"}
        with patch.object(server, "read_lessons", return_value=[existing]), \
             patch.object(server.threading, "Thread") as thread_class, \
             patch.object(server, "log_debug"):
            server.start_featured_pick(now)
        thread_class.assert_not_called()

    def test_repeated_start_queues_only_one_generation(self):
        now = datetime(2026, 10, 9, 12, tzinfo=IST)
        with patch.object(server, "read_lessons", return_value=[]), \
             patch.object(server.threading, "Thread") as thread_class, \
             patch.object(server, "log_debug"):
            server.start_featured_pick(now)
            server.start_featured_pick(now)
        self.assertEqual(thread_class.call_count, 1)
        self.assertEqual(server.PICK_STATE["status"], "researching")


if __name__ == "__main__":
    unittest.main()
