package com.example.biteswipe

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.biteswipe.adapter.UserAdapter
import com.example.biteswipe.cards.UserCard

class ModerateGroupPage : AppCompatActivity() {
    private lateinit var users: MutableList<UserCard>
    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: UserAdapter
    private var TAG = "ModerateGroupPage"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_moderate_group_page)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }
//        TODO: API Call to fetch users from backend (PERSISTENT)
        users = mutableListOf(
            UserCard("John Doe", R.drawable.ic_settings),
            UserCard("Jane Doe", R.drawable.ic_settings),
            UserCard("Mike Tyson", R.drawable.ic_launcher_background)
        )
//        TODO: Implement Dynamic Rendering of Users
        recyclerView = findViewById(R.id.user_moderate_recycler_view)
        recyclerView.layoutManager = LinearLayoutManager(this, LinearLayoutManager.VERTICAL, false)
        adapter = UserAdapter(this, users) { user -> handleKickUser(user) }
        recyclerView.adapter = adapter
        Log.d(TAG, "Set up users")
//        TODO: Start Matching Button
        val startMatchingButton = findViewById<Button>(R.id.start_matching_button)
        startMatchingButton.setOnClickListener {
            val intent = Intent(this, MatchingPage::class.java)
            startActivity(intent)
        }
//        TODO: Delete Group Button
    }

    private fun handleKickUser(user: UserCard) {
        // TODO: API Call to kick user from group

//        On confirmation, remove user from the list
        users.remove(user)
        adapter.notifyDataSetChanged()

        Toast.makeText(this, "${user.userName} has been kicked from the group.", Toast.LENGTH_SHORT).show()
    }
}