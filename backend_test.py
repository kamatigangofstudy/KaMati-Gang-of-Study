import requests
import sys
import json
from datetime import datetime

class KaMaTiAPITester:
    def __init__(self, base_url="https://kamati-hub.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_ids = {
            'notes': [],
            'discussions': [],
            'feedback': []
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}" if endpoint else self.base_url
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )
        return success

    def test_notes_endpoints(self):
        """Test all notes-related endpoints"""
        print("\n📚 Testing Notes Endpoints...")
        
        # Test GET notes (empty initially)
        success, notes = self.run_test(
            "Get All Notes (Empty)",
            "GET",
            "notes",
            200
        )
        if not success:
            return False

        # Test POST create note
        test_note = {
            "title": "Test Mathematics Note",
            "subject": "Mathematics",
            "semester": "3",
            "size": "2.5 MB",
            "file_url": "https://example.com/test-note.pdf"
        }
        
        success, created_note = self.run_test(
            "Create Note",
            "POST",
            "notes",
            200,  # Backend returns 200, not 201
            data=test_note
        )
        if success and 'id' in created_note:
            self.created_ids['notes'].append(created_note['id'])
            note_id = created_note['id']
            
            # Test GET specific note
            success, _ = self.run_test(
                "Get Specific Note",
                "GET",
                f"notes/{note_id}",
                200
            )
            
            # Test GET notes with filters
            success, filtered_notes = self.run_test(
                "Get Notes with Filters",
                "GET",
                "notes",
                200,
                params={"semester": "3", "subject": "Mathematics"}
            )
            
            return success
        
        return False

    def test_discussions_endpoints(self):
        """Test all discussion-related endpoints"""
        print("\n💬 Testing Discussion Endpoints...")
        
        # Test GET discussions (empty initially)
        success, discussions = self.run_test(
            "Get All Discussions (Empty)",
            "GET",
            "discussions",
            200
        )
        if not success:
            return False

        # Test POST create discussion
        test_discussion = {
            "title": "Test Discussion About Mathematics",
            "content": "I need help with calculus problems. Can anyone explain derivatives?",
            "author": "TestStudent"
        }
        
        success, created_discussion = self.run_test(
            "Create Discussion",
            "POST",
            "discussions",
            200,
            data=test_discussion
        )
        if success and 'id' in created_discussion:
            self.created_ids['discussions'].append(created_discussion['id'])
            discussion_id = created_discussion['id']
            
            # Test GET specific discussion
            success, _ = self.run_test(
                "Get Specific Discussion",
                "GET",
                f"discussions/{discussion_id}",
                200
            )
            
            # Test upvote discussion
            success, _ = self.run_test(
                "Upvote Discussion",
                "POST",
                f"discussions/{discussion_id}/upvote",
                200
            )
            
            # Test create reply
            test_reply = {
                "discussion_id": discussion_id,
                "content": "I can help you with derivatives! They represent the rate of change.",
                "author": "HelpfulStudent"
            }
            
            success, created_reply = self.run_test(
                "Create Reply",
                "POST",
                f"discussions/{discussion_id}/replies",
                200,
                data=test_reply
            )
            
            if success and 'id' in created_reply:
                reply_id = created_reply['id']
                
                # Test get replies
                success, _ = self.run_test(
                    "Get Discussion Replies",
                    "GET",
                    f"discussions/{discussion_id}/replies",
                    200
                )
                
                # Test upvote reply
                success, _ = self.run_test(
                    "Upvote Reply",
                    "POST",
                    f"replies/{reply_id}/upvote",
                    200
                )
            
            return success
        
        return False

    def test_feedback_endpoints(self):
        """Test feedback endpoints"""
        print("\n⭐ Testing Feedback Endpoints...")
        
        # Test POST feedback
        test_feedback = {
            "rating": 5,
            "comment": "Great platform! Very helpful for IPU students.",
            "name": "Test Student"
        }
        
        success, created_feedback = self.run_test(
            "Submit Feedback",
            "POST",
            "feedback",
            200,
            data=test_feedback
        )
        if success and 'id' in created_feedback:
            self.created_ids['feedback'].append(created_feedback['id'])
            
            # Test GET feedback
            success, _ = self.run_test(
                "Get All Feedback",
                "GET",
                "feedback",
                200
            )
            
            return success
        
        return False

    def test_search_endpoints(self):
        """Test search functionality"""
        print("\n🔍 Testing Search Endpoints...")
        
        # Test search notes
        success, _ = self.run_test(
            "Search Notes",
            "GET",
            "search/notes",
            200,
            params={"q": "Mathematics"}
        )
        if not success:
            return False
        
        # Test search discussions
        success, _ = self.run_test(
            "Search Discussions",
            "GET",
            "search/discussions",
            200,
            params={"q": "calculus"}
        )
        
        return success

    def test_delete_endpoints(self):
        """Test delete functionality"""
        print("\n🗑️ Testing Delete Endpoints...")
        
        # Only test delete if we have created items
        if self.created_ids['discussions']:
            discussion_id = self.created_ids['discussions'][0]
            success, _ = self.run_test(
                "Delete Discussion",
                "DELETE",
                f"discussions/{discussion_id}",
                200
            )
            if not success:
                return False
        
        if self.created_ids['notes']:
            note_id = self.created_ids['notes'][0]
            success, _ = self.run_test(
                "Delete Note",
                "DELETE",
                f"notes/{note_id}",
                200
            )
            if not success:
                return False
        
        return True

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting KaMaTi Gang Study Hub API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Test root endpoint
        if not self.test_root_endpoint():
            print("❌ Root endpoint failed, stopping tests")
            return False
        
        # Test notes endpoints
        if not self.test_notes_endpoints():
            print("❌ Notes endpoints failed")
            return False
        
        # Test discussions endpoints
        if not self.test_discussions_endpoints():
            print("❌ Discussion endpoints failed")
            return False
        
        # Test feedback endpoints
        if not self.test_feedback_endpoints():
            print("❌ Feedback endpoints failed")
            return False
        
        # Test search endpoints
        if not self.test_search_endpoints():
            print("❌ Search endpoints failed")
            return False
        
        # Test delete endpoints
        if not self.test_delete_endpoints():
            print("❌ Delete endpoints failed")
            return False
        
        return True

    def print_summary(self):
        """Print test summary"""
        print(f"\n📊 Test Summary:")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.created_ids['notes']:
            print(f"Created Notes: {len(self.created_ids['notes'])}")
        if self.created_ids['discussions']:
            print(f"Created Discussions: {len(self.created_ids['discussions'])}")
        if self.created_ids['feedback']:
            print(f"Created Feedback: {len(self.created_ids['feedback'])}")

def main():
    tester = KaMaTiAPITester()
    
    success = tester.run_all_tests()
    tester.print_summary()
    
    if success:
        print("\n🎉 All API tests passed! Backend is working correctly.")
        return 0
    else:
        print("\n💥 Some API tests failed. Check the errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())