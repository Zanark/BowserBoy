import unittest

from native_rules import chapter_content_pages, has_private_marker


class NativeRulesTest(unittest.TestCase):
    def test_https_is_not_a_windows_drive_but_real_private_markers_fail(self):
        self.assertFalse(has_private_marker("References: https://threejs.org/docs/"))
        for value in [r"C:\Users\private\book.pdf", "Z:/private/book", "file:///private", ".agent-context"]:
            with self.subTest(value=value):
                self.assertTrue(has_private_marker(value))

    def test_native_depth_excludes_openers_and_overlapping_ranges(self):
        policy = {"minimumPages": 200, "minimumBodyPages": 200}
        chapter = {"id": "MD01", "openingPage": 3, "startPage": 4, "endPage": 203}
        self.assertEqual(chapter_content_pages(policy, 203, [chapter]), 200)
        with self.assertRaisesRegex(ValueError, "actual-page"):
            chapter_content_pages(policy, 199, [])
        with self.assertRaisesRegex(ValueError, "chapter-content"):
            chapter_content_pages(policy, 203, [dict(chapter, endPage=103)] * 2)
        with self.assertRaisesRegex(ValueError, "Invalid native"):
            chapter_content_pages(policy, 203, [dict(chapter, startPage=3)])


if __name__ == "__main__":
    unittest.main()
